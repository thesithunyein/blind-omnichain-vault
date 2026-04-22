use anchor_lang::prelude::*;

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
    #[msg("Caller is not authorized for this action.")]
    Unauthorized,
    #[msg("FHE operation failed or returned an unexpected shape.")]
    FheOpFailed,
    #[msg("Ika CPI failed or was rejected.")]
    IkaCpiFailed,
    #[msg("Threshold decryption CPI failed or returned an unexpected result.")]
    DecryptionFailed,
}
