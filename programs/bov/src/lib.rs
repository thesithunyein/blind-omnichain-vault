// ============================================================
// Blind Omnichain Vault (BOV) — Solana Anchor Program v0.1.0
// Live demo : https://blind-omnichain-vault.vercel.app
// GitHub    : https://github.com/thesithunyein/blind-omnichain-vault
//
// Architecture
// ─────────────────────────────────────────────────────────
//   Native chains ──► Ika dWallets (2PC-MPC custody)
//   Solana program ──► state machine, stores FHE ciphertexts
//   Encrypt FHE ──► executor nodes do homomorphic compute
//
//   Ika and Encrypt are pre-alpha; their devnet programs are
//   not yet publicly deployed.  On devnet this program:
//     • stores the client-produced ciphertext blob for deposit
//     • emits a verifiable event for rebalance (Ika reads it)
//     • zeroes the ciphertext on withdraw (off-chain decrypt)
//   Every balance field is Vec<u8> — never a plaintext number.
// ============================================================
use anchor_lang::prelude::*;

declare_id!("6jkfCwYGm33xFqBfajHHWxcnG1YJzm2Jd7cME2jUNaaf");

// ---------------------------------------------------------------------------
// Chain enum
// ---------------------------------------------------------------------------

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum DWalletChain {
    Bitcoin  = 0,
    Ethereum = 1,
    Sui      = 2,
    Solana   = 3,
    Zcash    = 4,
    Cosmos   = 5,
}

// ---------------------------------------------------------------------------
// State accounts
// ---------------------------------------------------------------------------

#[account]
pub struct Vault {
    pub vault_id:   u64,
    pub authority:  Pubkey,
    pub bump:       u8,
    pub paused:     bool,
    pub dwallet_count:     u8,
    pub total_depositors:  u64,
    pub total_rebalances:  u64,
    /// Chains supported (max 8, stored as u8 discriminants)
    pub supported_chains:  Vec<u8>,
    /// One ciphertext per supported chain (target weight, bps)
    pub enc_target_weights: Vec<Vec<u8>>,
    /// Rebalance band (bps) as ciphertext
    pub enc_rebalance_band: Vec<u8>,
    /// Vault NAV as ciphertext
    pub enc_nav:            Vec<u8>,
}

impl Vault {
    pub const MAX_CHAINS: usize = 8;
    // discriminator + scalars + 3 nested vecs (conservatively)
    pub const SPACE: usize = 8 + 8 + 32 + 1 + 1 + 1 + 8 + 8
        + (4 + 8)                   // supported_chains
        + (4 + 8 * (4 + 256))       // enc_target_weights
        + (4 + 256)                 // enc_rebalance_band
        + (4 + 256);                // enc_nav
}

#[account]
pub struct DWalletRegistryEntry {
    pub vault:           Pubkey,
    pub chain:           u8,
    pub dwallet_id:      [u8; 32],
    pub foreign_address: Vec<u8>,
    pub bump:            u8,
}

impl DWalletRegistryEntry {
    pub const MAX_ADDR: usize = 64;
    pub const SPACE: usize = 8 + 32 + 1 + 32 + (4 + 64) + 1;
}

#[account]
pub struct UserLedger {
    pub owner:            Pubkey,
    pub vault:            Pubkey,
    pub enc_shares:       Vec<u8>,
    pub deposit_count:    u64,
    pub bump:             u8,
}

impl UserLedger {
    pub const SPACE: usize = 8 + 32 + 32 + (4 + 1024) + 8 + 1;
}

#[account]
pub struct ChainBalance {
    pub vault:       Pubkey,
    pub chain:       u8,
    pub enc_balance: Vec<u8>,
    pub bump:        u8,
}

impl ChainBalance {
    pub const SPACE: usize = 8 + 32 + 1 + (4 + 1024) + 1;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[error_code]
pub enum BovError {
    #[msg("Chain and weight vectors have different lengths.")]
    ChainWeightMismatch,
    #[msg("Too many chains configured for this vault.")]
    TooManyChains,
    #[msg("Chain is not supported by this vault.")]
    ChainNotSupported,
    #[msg("Too many dWallets already registered.")]
    TooManyDWallets,
    #[msg("Foreign address exceeds max length.")]
    AddressTooLong,
    #[msg("Vault is paused.")]
    VaultPaused,
    #[msg("Caller is not authorised.")]
    Unauthorized,
    #[msg("Ciphertext is empty.")]
    EmptyCiphertext,
    #[msg("Ciphertext exceeds maximum size.")]
    CiphertextTooLarge,
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

#[event]
pub struct VaultInitialized {
    pub vault:     Pubkey,
    pub authority: Pubkey,
    pub vault_id:  u64,
}

#[event]
pub struct DWalletRegistered {
    pub vault:      Pubkey,
    pub chain:      u8,
    pub dwallet_id: [u8; 32],
}

#[event]
pub struct EncryptedDeposit {
    pub vault:          Pubkey,
    pub user:           Pubkey,
    pub chain:          u8,
    pub ciphertext_len: u32,
    pub deposit_count:  u64,
}

#[event]
pub struct RebalanceRequested {
    pub vault:            Pubkey,
    pub from_chain:       u8,
    pub to_chain:         u8,
    pub prepared_digest:  [u8; 32],
    pub rebalance_nonce:  u64,
}

#[event]
pub struct WithdrawInitiated {
    pub vault:  Pubkey,
    pub user:   Pubkey,
    pub chain:  u8,
}

// ---------------------------------------------------------------------------
// Accounts contexts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(vault_id: u64)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer  = authority,
        space  = Vault::SPACE,
        seeds  = [b"vault", authority.key().as_ref(), &vault_id.to_le_bytes()],
        bump
    )]
    pub vault:          Account<'info, Vault>,
    #[account(mut)]
    pub authority:      Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(chain: u8, dwallet_id: [u8; 32])]
pub struct RegisterDWallet<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref(), &vault.vault_id.to_le_bytes()],
        bump  = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        init,
        payer  = authority,
        space  = DWalletRegistryEntry::SPACE,
        seeds  = [b"dwallet", vault.key().as_ref(), &dwallet_id],
        bump
    )]
    pub registry_entry: Account<'info, DWalletRegistryEntry>,
    #[account(mut)]
    pub authority:      Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(chain: u8)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref(), &vault.vault_id.to_le_bytes()],
        bump  = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        init_if_needed,
        payer  = user,
        space  = UserLedger::SPACE,
        seeds  = [b"ledger", vault.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_ledger: Account<'info, UserLedger>,
    #[account(
        init_if_needed,
        payer  = user,
        space  = ChainBalance::SPACE,
        seeds  = [b"chainbal", vault.key().as_ref(), &[chain]],
        bump
    )]
    pub chain_balance:  Account<'info, ChainBalance>,
    #[account(mut)]
    pub user:           Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RequestRebalance<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref(), &vault.vault_id.to_le_bytes()],
        bump  = vault.bump
    )]
    pub vault:   Account<'info, Vault>,
    pub cranker: Signer<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        seeds = [b"vault", vault.authority.as_ref(), &vault.vault_id.to_le_bytes()],
        bump  = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        seeds = [b"ledger", vault.key().as_ref(), user.key().as_ref()],
        bump  = user_ledger.bump,
        has_one = vault
    )]
    pub user_ledger: Account<'info, UserLedger>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [b"vault", vault.authority.as_ref(), &vault.vault_id.to_le_bytes()],
        bump  = vault.bump
    )]
    pub vault:     Account<'info, Vault>,
    pub authority: Signer<'info>,
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

#[program]
pub mod bov {
    use super::*;

    /// Create a new vault with encrypted strategy weights.
    pub fn initialize_vault(
        ctx:   Context<InitializeVault>,
        vault_id: u64,
        enc_target_weights: Vec<Vec<u8>>,
        enc_rebalance_band: Vec<u8>,
        supported_chains:   Vec<u8>,
    ) -> Result<()> {
        require!(supported_chains.len() == enc_target_weights.len(), BovError::ChainWeightMismatch);
        require!(supported_chains.len() <= Vault::MAX_CHAINS,         BovError::TooManyChains);
        for w in &enc_target_weights { require!(w.len() <= 256, BovError::CiphertextTooLarge); }
        require!(enc_rebalance_band.len() <= 256, BovError::CiphertextTooLarge);

        let v = &mut ctx.accounts.vault;
        v.vault_id           = vault_id;
        v.authority          = ctx.accounts.authority.key();
        v.bump               = ctx.bumps.vault;
        v.paused             = false;
        v.dwallet_count      = 0;
        v.total_depositors   = 0;
        v.total_rebalances   = 0;
        v.supported_chains   = supported_chains;
        v.enc_target_weights = enc_target_weights;
        v.enc_rebalance_band = enc_rebalance_band;
        v.enc_nav            = vec![0u8; 32];

        emit!(VaultInitialized { vault: v.key(), authority: v.authority, vault_id });
        Ok(())
    }

    /// Bind an Ika dWallet (2PC-MPC custody) to this vault for one chain.
    pub fn register_dwallet(
        ctx:            Context<RegisterDWallet>,
        chain:          u8,
        dwallet_id:     [u8; 32],
        foreign_address: Vec<u8>,
    ) -> Result<()> {
        require!(!ctx.accounts.vault.paused,                            BovError::VaultPaused);
        require!(foreign_address.len() <= DWalletRegistryEntry::MAX_ADDR, BovError::AddressTooLong);
        require!((ctx.accounts.vault.dwallet_count as usize) < Vault::MAX_CHAINS, BovError::TooManyDWallets);

        let e = &mut ctx.accounts.registry_entry;
        e.vault           = ctx.accounts.vault.key();
        e.chain           = chain;
        e.dwallet_id      = dwallet_id;
        e.foreign_address = foreign_address;
        e.bump            = ctx.bumps.registry_entry;

        ctx.accounts.vault.dwallet_count =
            ctx.accounts.vault.dwallet_count.saturating_add(1);

        emit!(DWalletRegistered { vault: e.vault, chain, dwallet_id });
        Ok(())
    }

    /// Record an encrypted deposit.  The native asset already sits in the dWallet
    /// foreign address; this writes the FHE ciphertext on-chain so the vault NAV
    /// and user ledger stay encrypted end-to-end.
    pub fn deposit(
        ctx:              Context<Deposit>,
        chain:            u8,
        encrypted_amount: Vec<u8>,
    ) -> Result<()> {
        require!(!ctx.accounts.vault.paused, BovError::VaultPaused);
        require!(!encrypted_amount.is_empty(), BovError::EmptyCiphertext);
        require!(encrypted_amount.len() <= 1024, BovError::CiphertextTooLarge);

        let v  = &mut ctx.accounts.vault;
        let ul = &mut ctx.accounts.user_ledger;
        let cb = &mut ctx.accounts.chain_balance;

        if ul.owner == Pubkey::default() {
            ul.owner         = ctx.accounts.user.key();
            ul.vault         = v.key();
            ul.bump          = ctx.bumps.user_ledger;
            ul.deposit_count = 0;
            ul.enc_shares    = vec![0u8; 32];
            v.total_depositors = v.total_depositors.saturating_add(1);
        }
        if cb.vault == Pubkey::default() {
            cb.vault        = v.key();
            cb.chain        = chain;
            cb.enc_balance  = vec![0u8; 32];
            cb.bump         = ctx.bumps.chain_balance;
        }

        // Store ciphertext.  Production: Encrypt CPI fhe_add here.
        ul.enc_shares   = encrypted_amount.clone();
        ul.deposit_count = ul.deposit_count.saturating_add(1);
        cb.enc_balance  = encrypted_amount.clone();

        emit!(EncryptedDeposit {
            vault:          v.key(),
            user:           ctx.accounts.user.key(),
            chain,
            ciphertext_len: encrypted_amount.len() as u32,
            deposit_count:  ul.deposit_count,
        });
        Ok(())
    }

    /// Evaluate the encrypted rebalance policy and emit a signed event for the
    /// Ika network to pick up.  Ika threshold-decrypts the guard ciphertext;
    /// the Solana program never learns whether the rebalance triggered.
    pub fn request_rebalance(
        ctx:             Context<RequestRebalance>,
        from_chain:      u8,
        to_chain:        u8,
        prepared_digest: [u8; 32],
    ) -> Result<()> {
        require!(!ctx.accounts.vault.paused, BovError::VaultPaused);

        let v = &mut ctx.accounts.vault;
        v.total_rebalances = v.total_rebalances.saturating_add(1);

        emit!(RebalanceRequested {
            vault:           v.key(),
            from_chain,
            to_chain,
            prepared_digest,
            rebalance_nonce: v.total_rebalances,
        });
        Ok(())
    }

    /// Initiate threshold decryption of ONLY the caller's encrypted share.
    /// All other users' balances remain encrypted and inaccessible.
    pub fn withdraw(ctx: Context<Withdraw>, chain: u8) -> Result<()> {
        require!(!ctx.accounts.vault.paused, BovError::VaultPaused);
        require_keys_eq!(ctx.accounts.user_ledger.owner, ctx.accounts.user.key(), BovError::Unauthorized);

        // Zero out this user's ciphertext.  Production: Encrypt threshold-decrypt CPI.
        ctx.accounts.user_ledger.enc_shares = vec![0u8; 32];

        emit!(WithdrawInitiated {
            vault: ctx.accounts.vault.key(),
            user:  ctx.accounts.user.key(),
            chain,
        });
        Ok(())
    }

    /// Emergency pause / unpause (authority only).
    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        ctx.accounts.vault.paused = paused;
        Ok(())
    }
}
