//! # Blind Omnichain Vault (BOV)
//!
//! A Solana program that manages multi-chain native assets through **Ika dWallets**
//! while keeping per-user balances, strategy parameters, and rebalance signals
//! encrypted via **Encrypt FHE** ciphertexts.
//!
//! ## Program entrypoints (high level)
//!
//! - [`initialize_vault`] — create a new vault with an encrypted target-weight policy.
//! - [`register_dwallet`]  — bind an Ika dWallet (e.g. a BTC address) to this vault.
//! - [`deposit`]           — record an encrypted deposit against a user's encrypted sub-ledger.
//! - [`request_rebalance`] — Solana evaluates an FHE rebalance policy over the encrypted
//!                           ledger and, if triggered, issues an `ApproveDWalletSign`
//!                           CPI to the Ika program for the cross-chain transaction.
//! - [`withdraw`]          — threshold-decrypts the caller's share only.
//!
//! Nothing except the caller's own withdraw output is ever decrypted on-chain.

use anchor_lang::prelude::*;

pub mod encrypt;
pub mod errors;
pub mod ika;
pub mod policy;
pub mod state;

use crate::encrypt::EncU64;
use crate::errors::BovError;
use crate::ika::DWalletChain;
use crate::state::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod bov {
    use super::*;

    /// Create a new vault.
    ///
    /// `encrypted_target_weights` is an array of Encrypt `EncU64` ciphertexts, one per
    /// supported chain (basis points summing to 10_000 when decrypted). The Solana
    /// program never learns the plaintext weights; it only homomorphically compares
    /// them against the encrypted current weights when deciding whether to rebalance.
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        vault_id: u64,
        encrypted_target_weights: Vec<EncU64>,
        encrypted_rebalance_band_bps: EncU64,
        supported_chains: Vec<DWalletChain>,
    ) -> Result<()> {
        require!(
            encrypted_target_weights.len() == supported_chains.len(),
            BovError::ChainWeightMismatch
        );
        require!(
            supported_chains.len() <= Vault::MAX_CHAINS,
            BovError::TooManyChains
        );

        let vault = &mut ctx.accounts.vault;
        vault.vault_id = vault_id;
        vault.authority = ctx.accounts.authority.key();
        vault.bump = ctx.bumps.vault;
        vault.supported_chains = supported_chains;
        vault.encrypted_target_weights = encrypted_target_weights;
        vault.encrypted_rebalance_band_bps = encrypted_rebalance_band_bps;
        vault.encrypted_nav = EncU64::zero();
        vault.total_depositors = 0;
        vault.dwallet_count = 0;
        vault.paused = false;

        emit!(VaultInitialized {
            vault: vault.key(),
            authority: vault.authority,
            vault_id,
        });
        Ok(())
    }

    /// Bind an Ika dWallet (identified by its `dwallet_id`) to this vault for a given chain.
    /// The dWallet's "policy share" is held by this program; the "user share" is held by the
    /// depositor off-chain. No single party can sign alone — that's 2PC-MPC.
    pub fn register_dwallet(
        ctx: Context<RegisterDWallet>,
        chain: DWalletChain,
        dwallet_id: [u8; 32],
        foreign_address: Vec<u8>,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(!vault.paused, BovError::VaultPaused);
        require!(
            vault.supported_chains.contains(&chain),
            BovError::ChainNotSupported
        );
        require!(
            foreign_address.len() <= DWalletRegistryEntry::MAX_ADDR_LEN,
            BovError::AddressTooLong
        );
        require!(
            (vault.dwallet_count as usize) < Vault::MAX_CHAINS,
            BovError::TooManyDWallets
        );

        let entry = &mut ctx.accounts.registry_entry;
        entry.vault = vault.key();
        entry.chain = chain;
        entry.dwallet_id = dwallet_id;
        entry.foreign_address = foreign_address;
        entry.bump = ctx.bumps.registry_entry;
        vault.dwallet_count = vault.dwallet_count.saturating_add(1);

        // Optional CPI hook: notify the Ika program we now own the policy share.
        ika::cpi_notify_policy_binding(&ctx.accounts.ika_program, vault.key(), dwallet_id)?;

        emit!(DWalletRegistered {
            vault: vault.key(),
            chain,
            dwallet_id,
        });
        Ok(())
    }

    /// Record an encrypted deposit. The user has already sent the native asset
    /// (e.g. BTC) to the dWallet's foreign address; this instruction updates the
    /// encrypted ledger to reflect it.
    ///
    /// `encrypted_amount` is an Encrypt FHE ciphertext produced client-side with
    /// the vault's public key. The program homomorphically adds it to:
    ///   1) the user's encrypted sub-ledger,
    ///   2) the per-chain encrypted balance,
    ///   3) the vault's encrypted NAV.
    pub fn deposit(
        ctx: Context<Deposit>,
        chain: DWalletChain,
        encrypted_amount: EncU64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(!vault.paused, BovError::VaultPaused);

        let user_ledger = &mut ctx.accounts.user_ledger;
        if user_ledger.owner == Pubkey::default() {
            user_ledger.owner = ctx.accounts.user.key();
            user_ledger.vault = vault.key();
            user_ledger.encrypted_shares = EncU64::zero();
            user_ledger.bump = ctx.bumps.user_ledger;
            vault.total_depositors = vault.total_depositors.saturating_add(1);
        }

        let chain_balance = &mut ctx.accounts.chain_balance;
        if chain_balance.vault == Pubkey::default() {
            chain_balance.vault = vault.key();
            chain_balance.chain = chain;
            chain_balance.encrypted_balance = EncU64::zero();
            chain_balance.bump = ctx.bumps.chain_balance;
        }

        // FHE adds — these are CPIs into the Encrypt program.
        user_ledger.encrypted_shares =
            encrypt::fhe_add(&ctx.accounts.encrypt_program, &user_ledger.encrypted_shares, &encrypted_amount)?;
        chain_balance.encrypted_balance =
            encrypt::fhe_add(&ctx.accounts.encrypt_program, &chain_balance.encrypted_balance, &encrypted_amount)?;
        vault.encrypted_nav =
            encrypt::fhe_add(&ctx.accounts.encrypt_program, &vault.encrypted_nav, &encrypted_amount)?;

        emit!(EncryptedDeposit {
            vault: vault.key(),
            user: ctx.accounts.user.key(),
            chain,
        });
        Ok(())
    }

    /// Evaluate the encrypted rebalance policy. If triggered (in ciphertext), issue
    /// an `ApproveDWalletSign` CPI so Ika will co-sign the prepared cross-chain
    /// transaction. The program never learns whether the trigger fired — the Ika
    /// program consumes the encrypted boolean via a threshold-decrypt on its own side.
    pub fn request_rebalance(
        ctx: Context<RequestRebalance>,
        from_chain: DWalletChain,
        to_chain: DWalletChain,
        prepared_tx_digest: [u8; 32],
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        require!(!vault.paused, BovError::VaultPaused);

        let encrypted_should_rebalance = policy::evaluate_rebalance_policy(
            &ctx.accounts.encrypt_program,
            vault,
            &ctx.accounts.from_balance,
            &ctx.accounts.to_balance,
        )?;

        // Conditionally approve the signature. Ika will threshold-decrypt the
        // guard ciphertext; if false, it aborts the 2PC-MPC round.
        ika::cpi_approve_dwallet_sign_if(
            &ctx.accounts.ika_program,
            &ctx.accounts.from_registry.dwallet_id,
            prepared_tx_digest,
            &encrypted_should_rebalance,
        )?;

        emit!(RebalanceRequested {
            vault: vault.key(),
            from_chain,
            to_chain,
        });
        Ok(())
    }

    /// Withdraw: produce a threshold-decryption request for the caller's own
    /// encrypted share only. Other users' balances remain encrypted. A downstream
    /// cranker will use the decrypted amount to produce a dWallet payout tx and
    /// submit it through `request_rebalance`-style flow.
    pub fn withdraw(ctx: Context<Withdraw>, chain: DWalletChain) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(!vault.paused, BovError::VaultPaused);

        let user_ledger = &mut ctx.accounts.user_ledger;
        require_keys_eq!(user_ledger.owner, ctx.accounts.user.key(), BovError::Unauthorized);

        // Initiate threshold decryption of ONLY this user's share.
        encrypt::cpi_threshold_decrypt(
            &ctx.accounts.encrypt_program,
            &user_ledger.encrypted_shares,
            ctx.accounts.user.key(),
        )?;

        // Zero the user's encrypted share (FHE subtract from itself).
        user_ledger.encrypted_shares = EncU64::zero();

        emit!(WithdrawInitiated {
            vault: vault.key(),
            user: ctx.accounts.user.key(),
            chain,
        });
        Ok(())
    }

    /// Emergency pause (authority only).
    pub fn set_paused(ctx: Context<AuthorityOnly>, paused: bool) -> Result<()> {
        ctx.accounts.vault.paused = paused;
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Accounts contexts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(vault_id: u64)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = Vault::SIZE,
        seeds = [b"vault", authority.key().as_ref(), &vault_id.to_le_bytes()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(chain: DWalletChain, dwallet_id: [u8; 32])]
pub struct RegisterDWallet<'info> {
    #[account(mut, has_one = authority)]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = authority,
        space = DWalletRegistryEntry::SIZE,
        seeds = [b"dwallet", vault.key().as_ref(), &dwallet_id],
        bump
    )]
    pub registry_entry: Account<'info, DWalletRegistryEntry>,

    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Ika program, validated by ID at integration time.
    pub ika_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(chain: DWalletChain)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserLedger::SIZE,
        seeds = [b"ledger", vault.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_ledger: Account<'info, UserLedger>,

    #[account(
        init_if_needed,
        payer = user,
        space = ChainBalance::SIZE,
        seeds = [b"chainbal", vault.key().as_ref(), &[chain as u8]],
        bump
    )]
    pub chain_balance: Account<'info, ChainBalance>,

    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: Encrypt program.
    pub encrypt_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RequestRebalance<'info> {
    pub vault: Account<'info, Vault>,
    pub from_balance: Account<'info, ChainBalance>,
    pub to_balance: Account<'info, ChainBalance>,
    pub from_registry: Account<'info, DWalletRegistryEntry>,
    pub cranker: Signer<'info>,
    /// CHECK: Ika program.
    pub ika_program: UncheckedAccount<'info>,
    /// CHECK: Encrypt program.
    pub encrypt_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut, has_one = vault)]
    pub user_ledger: Account<'info, UserLedger>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: Encrypt program.
    pub encrypt_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct AuthorityOnly<'info> {
    #[account(mut, has_one = authority)]
    pub vault: Account<'info, Vault>,
    pub authority: Signer<'info>,
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

#[event]
pub struct VaultInitialized {
    pub vault: Pubkey,
    pub authority: Pubkey,
    pub vault_id: u64,
}

#[event]
pub struct DWalletRegistered {
    pub vault: Pubkey,
    pub chain: DWalletChain,
    pub dwallet_id: [u8; 32],
}

#[event]
pub struct EncryptedDeposit {
    pub vault: Pubkey,
    pub user: Pubkey,
    pub chain: DWalletChain,
}

#[event]
pub struct RebalanceRequested {
    pub vault: Pubkey,
    pub from_chain: DWalletChain,
    pub to_chain: DWalletChain,
}

#[event]
pub struct WithdrawInitiated {
    pub vault: Pubkey,
    pub user: Pubkey,
    pub chain: DWalletChain,
}
