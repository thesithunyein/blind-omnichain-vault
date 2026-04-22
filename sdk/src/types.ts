import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

/** Chains supported for dWallet custody. Must match the Rust enum order. */
export enum DWalletChain {
  Bitcoin = 0,
  Ethereum = 1,
  Sui = 2,
  Solana = 3,
  Zcash = 4,
  Cosmos = 5,
}

/** Encrypted unsigned 64-bit integer ciphertext, opaque bytes. */
export interface EncU64 {
  bytes: Uint8Array;
}

/** Encrypted boolean ciphertext, opaque bytes. */
export interface EncBool {
  bytes: Uint8Array;
}

export interface VaultConfig {
  authority: PublicKey;
  vaultId: BN;
  supportedChains: DWalletChain[];
  /** plaintext targets (bps) — encrypted client-side before submission */
  targetWeightsBps: number[];
  /** plaintext band (bps) — encrypted client-side before submission */
  rebalanceBandBps: number;
}
