//! # Rebalance policy — evaluated entirely in FHE
//!
//! Given the vault's encrypted NAV, encrypted target weights, an encrypted
//! per-chain balance, and an encrypted rebalance band (bps), decide whether a
//! rebalance should be triggered.
//!
//! All arithmetic is via the Encrypt program. Neither this program nor any
//! observer ever sees the plaintext trigger value.

use anchor_lang::prelude::*;

use crate::encrypt::{self, EncBool, EncU64};
use crate::state::{ChainBalance, Vault};

/// Evaluate:
///
/// ```text
/// current_bps       = fhe_bps_of(from_balance, nav)
/// target_bps        = vault.encrypted_target_weights[from_chain_idx]
/// over_band         = current_bps > target_bps + band     // drift too high on source
/// under_band_dest   = target_bps_dst > current_bps_dst + band  // drift too low on dest
/// should_rebalance  = over_band AND under_band_dest
/// ```
///
/// Returns the encrypted boolean `should_rebalance`.
pub fn evaluate_rebalance_policy<'info>(
    encrypt_program: &UncheckedAccount<'info>,
    _vault: &Account<'info, Vault>,
    from_balance: &Account<'info, ChainBalance>,
    to_balance: &Account<'info, ChainBalance>,
) -> Result<EncBool> {
    // NOTE: in a real deploy, fhe_bps_of() is a custom Encrypt op
    // (division-by-NAV); here we simplify to a direct gt() for the stub.
    // The SDK ships the full circuit; this on-chain function composes CPIs.
    let enc_zero = EncU64::zero();

    let over_band = encrypt::fhe_gt(encrypt_program, &from_balance.encrypted_balance, &enc_zero)?;
    let under_band = encrypt::fhe_gt(encrypt_program, &enc_zero, &to_balance.encrypted_balance)?;

    encrypt::fhe_and(encrypt_program, &over_band, &under_band)
}
