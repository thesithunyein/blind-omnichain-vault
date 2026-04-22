//! Vault state accounts.
//!
//! All balance-like fields are stored as [`EncU64`] ciphertexts. They can only be
//! operated on via the Encrypt program (homomorphic add/sub/cmp) and decrypted
//! through threshold decryption.

use anchor_lang::prelude::*;

use crate::encrypt::EncU64;
use crate::ika::DWalletChain;

#[account]
pub struct Vault {
    pub vault_id: u64,
    pub authority: Pubkey,
    pub bump: u8,
    pub paused: bool,
    pub dwallet_count: u8,
    pub total_depositors: u64,

    pub supported_chains: Vec<DWalletChain>,
    pub encrypted_target_weights: Vec<EncU64>, // basis points, encrypted
    pub encrypted_rebalance_band_bps: EncU64,
    pub encrypted_nav: EncU64,
}

impl Vault {
    pub const MAX_CHAINS: usize = 8;
    pub const SIZE: usize = 8   // discriminator
        + 8                      // vault_id
        + 32                     // authority
        + 1 + 1 + 1              // bump + paused + dwallet_count
        + 8                      // total_depositors
        + 4 + Self::MAX_CHAINS * 1                     // supported_chains
        + 4 + Self::MAX_CHAINS * EncU64::MAX_SIZE      // encrypted_target_weights
        + EncU64::MAX_SIZE                             // encrypted_rebalance_band_bps
        + EncU64::MAX_SIZE;                            // encrypted_nav
}

#[account]
pub struct DWalletRegistryEntry {
    pub vault: Pubkey,
    pub chain: DWalletChain,
    pub dwallet_id: [u8; 32],
    pub foreign_address: Vec<u8>,
    pub bump: u8,
}

impl DWalletRegistryEntry {
    pub const MAX_ADDR_LEN: usize = 128;
    pub const SIZE: usize = 8 + 32 + 1 + 32 + 4 + Self::MAX_ADDR_LEN + 1;
}

#[account]
pub struct UserLedger {
    pub owner: Pubkey,
    pub vault: Pubkey,
    pub encrypted_shares: EncU64,
    pub deposit_count: u64,
    pub bump: u8,
}

impl UserLedger {
    pub const SIZE: usize = 8 + 32 + 32 + EncU64::MAX_SIZE + 8 + 1;
}

#[account]
pub struct ChainBalance {
    pub vault: Pubkey,
    pub chain: DWalletChain,
    pub encrypted_balance: EncU64,
    pub bump: u8,
}

impl ChainBalance {
    pub const SIZE: usize = 8 + 32 + 1 + EncU64::MAX_SIZE + 1;
}
