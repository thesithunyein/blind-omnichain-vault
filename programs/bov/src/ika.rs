//! # Ika dWallet integration layer
//!
//! A **dWallet** is a 2-of-2 signing primitive where:
//!   - one share is held by the user,
//!   - the other (the "policy share") is held by this Solana program.
//!
//! Cross-chain transactions are only signed by the Ika network when the Solana
//! program issues an `approve_dwallet_sign` CPI. Because the policy share lives
//! inside this program, *the rebalance policy itself is what approves the sign*.
//!
//! The key trick for BOV: we pass an encrypted boolean (`EncBool`) as the
//! guard condition so Ika co-signs only if Encrypt's threshold decryption of
//! that ciphertext evaluates to `true`. This keeps the rebalance trigger
//! private end-to-end.

use anchor_lang::prelude::*;

use crate::encrypt::EncBool;

/// Chains supported for dWallet custody.
#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum DWalletChain {
    Bitcoin = 0,
    Ethereum = 1,
    Sui = 2,
    Solana = 3,
    Zcash = 4,
    Cosmos = 5,
}

impl Default for DWalletChain {
    fn default() -> Self {
        DWalletChain::Bitcoin
    }
}

// ---------------------------------------------------------------------------
// CPI wrappers
// ---------------------------------------------------------------------------

/// Tell the Ika program that this vault PDA now holds the policy share for a
/// given `dwallet_id`. Called once per dWallet on `register_dwallet`.
pub fn cpi_notify_policy_binding<'info>(
    _ika_program: &UncheckedAccount<'info>,
    _vault: Pubkey,
    _dwallet_id: [u8; 32],
) -> Result<()> {
    // TODO: real CPI into Ika program.
    Ok(())
}

/// Conditionally approve a dWallet signing round. Ika threshold-decrypts
/// `guard` on its side; if `false`, the signing round is aborted.
pub fn cpi_approve_dwallet_sign_if<'info>(
    _ika_program: &UncheckedAccount<'info>,
    _dwallet_id: &[u8; 32],
    _tx_digest: [u8; 32],
    _guard: &EncBool,
) -> Result<()> {
    // TODO: real CPI into Ika program.
    Ok(())
}
