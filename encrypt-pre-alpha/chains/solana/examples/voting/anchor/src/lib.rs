use anchor_lang::prelude::*;
use encrypt_anchor::EncryptContext;
use encrypt_dsl::prelude::encrypt_fn;
use encrypt_types::encrypted::{EBool, EUint64};

// We keep their default program ID for now so we don't break the build config
declare_id!("VotingAnchor1111111111111111111111111111111");

// ── FHE Graph (The Privacy Engine) ──
#[encrypt_fn]
fn check_target_price_graph(
    current_oracle_price: EUint64,
    hidden_target_price: EUint64,
) -> EBool {
    // Returns an encrypted TRUE if the current price drops below or equals the target
    current_oracle_price <= hidden_target_price
}

// ── State (The Vault Data) ──
#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub authority: Pubkey,
    pub hidden_target_price: [u8; 32], // Ciphertext pubkey 
    pub is_active: bool,
    pub trigger_digest: [u8; 32], // Used when we decrypt the 'True/False' execution signal
    pub bump: u8,
}

// ── Instructions (The Smart Contract Logic) ──
#[program]
pub mod blind_omnichain_vault {
    use super::*;

    // Step 1: User creates the vault and deposits their hidden strategy
    pub fn setup_vault(
        ctx: Context<SetupVault>,
        hidden_target_price: [u8; 32], // The ciphertext from the Vercel frontend
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault_state;
        vault.authority = ctx.accounts.authority.key();
        vault.hidden_target_price = hidden_target_price;
        vault.is_active = true;
        vault.bump = ctx.bumps.vault_state;
        
        msg!("Blind Vault initialized! Strategy is hidden.");
        Ok(())
    }
}

// ── Accounts ──
#[derive(Accounts)]
pub struct SetupVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + VaultState::INIT_SPACE,
        seeds = [b"vault", authority.key().as_ref()],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}