//! # Encrypt FHE integration layer
//!
//! Wraps the Solana CPIs we make into the **Encrypt** program for:
//!
//! - [`fhe_add`] / [`fhe_sub`] / [`fhe_gt`] — homomorphic arithmetic / comparison
//!   over [`EncU64`] ciphertexts.
//! - [`cpi_threshold_decrypt`] — requests the Decryptor committee to threshold-decrypt
//!   a ciphertext and deliver the plaintext to a named recipient.
//!
//! The *on-chain* representation of an FHE ciphertext is opaque to this program.
//! The Encrypt devnet pre-alpha exposes:
//!   - fixed-size serialized ciphertexts (we use `MAX_SIZE` as the upper bound);
//!   - a program CPI surface for common ALU ops (see REFHE paper).
//!
//! This module intentionally contains thin stubs that match the *shape* of the
//! Encrypt pre-alpha devnet interface, so it compiles standalone. Swap the stub
//! bodies for real CPIs when the Encrypt program ID and IDL are final.

use anchor_lang::prelude::*;

/// Encrypted unsigned 64-bit integer. Fixed max serialized size so it fits in
/// program account layout; real ciphertext length depends on the FHE scheme
/// parameters chosen at the Encrypt cluster.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default, PartialEq, Eq)]
pub struct EncU64 {
    pub bytes: Vec<u8>,
}

impl EncU64 {
    /// Conservative upper bound for a REFHE-compatible u64 ciphertext body.
    /// Tune to the actual on-chain encoding at deploy time.
    pub const MAX_SIZE: usize = 4 + 1024;

    pub fn zero() -> Self {
        // Canonical encoding for "ciphertext of zero" in the Encrypt pre-alpha.
        // Client-side helpers produce a real zero-ciphertext with the cluster key.
        Self { bytes: Vec::new() }
    }

    pub fn is_zero(&self) -> bool {
        self.bytes.is_empty()
    }
}

/// Encrypted boolean, returned by homomorphic comparisons.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default)]
pub struct EncBool {
    pub bytes: Vec<u8>,
}

// ---------------------------------------------------------------------------
// CPI wrappers
// ---------------------------------------------------------------------------

/// Homomorphic add: `out = a + b`.
pub fn fhe_add<'info>(
    _encrypt_program: &UncheckedAccount<'info>,
    a: &EncU64,
    b: &EncU64,
) -> Result<EncU64> {
    // TODO: replace with real CPI into Encrypt program's `fhe_add` ix.
    // Placeholder: concatenates sizes so the ciphertext grows in tests,
    // mimicking the shape of a returned ciphertext. Real ALU is in-Encrypt.
    if a.is_zero() {
        return Ok(b.clone());
    }
    if b.is_zero() {
        return Ok(a.clone());
    }
    let mut out = Vec::with_capacity(a.bytes.len().max(b.bytes.len()));
    out.extend_from_slice(&a.bytes);
    out.extend_from_slice(&b.bytes);
    Ok(EncU64 { bytes: out })
}

/// Homomorphic sub: `out = a - b` (saturates at 0 on the decryption side).
pub fn fhe_sub<'info>(
    _encrypt_program: &UncheckedAccount<'info>,
    a: &EncU64,
    _b: &EncU64,
) -> Result<EncU64> {
    Ok(a.clone())
}

/// Homomorphic greater-than: `out = (a > b)` as an encrypted boolean.
pub fn fhe_gt<'info>(
    _encrypt_program: &UncheckedAccount<'info>,
    _a: &EncU64,
    _b: &EncU64,
) -> Result<EncBool> {
    Ok(EncBool::default())
}

/// Homomorphic AND over two encrypted booleans.
pub fn fhe_and<'info>(
    _encrypt_program: &UncheckedAccount<'info>,
    _a: &EncBool,
    _b: &EncBool,
) -> Result<EncBool> {
    Ok(EncBool::default())
}

/// Kick off a threshold decryption. The Decryptor committee will gather shares
/// and deliver the plaintext to `recipient` (e.g. via an Encrypt-native payout
/// program or an off-chain relayer indexed from on-chain events).
pub fn cpi_threshold_decrypt<'info>(
    _encrypt_program: &UncheckedAccount<'info>,
    _ciphertext: &EncU64,
    _recipient: Pubkey,
) -> Result<()> {
    // TODO: real CPI.
    Ok(())
}
