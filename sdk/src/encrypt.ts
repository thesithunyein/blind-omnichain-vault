/**
 * Client-side wrapper around the Encrypt FHE pre-alpha devnet.
 *
 * Produces ciphertexts (encryptU64), requests homomorphic ops, and handles
 * the client side of threshold decryption. The on-chain Solana program only
 * ever sees `EncU64` / `EncBool` bytes — never plaintext.
 *
 * NOTE: This is a devnet pre-alpha. We keep a clean in-memory reference
 * implementation behind the same interface, so tests run deterministically
 * until the Encrypt devnet endpoint is wired in via `attachEncryptProvider()`.
 */

import type { EncBool, EncU64 } from "./types";

// --- provider plumbing -----------------------------------------------------

export interface EncryptProvider {
  /** Encrypt a u64 under the vault's cluster public key. */
  encryptU64(value: bigint): Promise<EncU64>;
  /** Threshold-decrypt a ciphertext; resolves once committee reaches threshold. */
  decryptU64(ct: EncU64): Promise<bigint>;
  /** Homomorphic add (done on executor side for heavy circuits). */
  fheAdd(a: EncU64, b: EncU64): Promise<EncU64>;
  /** Homomorphic greater-than. */
  fheGt(a: EncU64, b: EncU64): Promise<EncBool>;
}

let _provider: EncryptProvider | null = null;

export function attachEncryptProvider(p: EncryptProvider) {
  _provider = p;
}

function provider(): EncryptProvider {
  if (!_provider) {
    // Lazy-load the in-memory dev provider as the default.
    _provider = makeInMemoryProvider();
  }
  return _provider;
}

// --- public API ------------------------------------------------------------

/** Encrypt a plaintext u64 (as bigint) into an `EncU64` for on-chain storage. */
export async function encryptU64(value: bigint): Promise<EncU64> {
  return provider().encryptU64(value);
}

/** Decrypt via the Decryptor committee (threshold). */
export async function decryptU64(ct: EncU64): Promise<bigint> {
  return provider().decryptU64(ct);
}

/** Encrypt each element of a bps weight vector. */
export async function encryptWeightsBps(weightsBps: number[]): Promise<EncU64[]> {
  return Promise.all(weightsBps.map((w) => encryptU64(BigInt(w))));
}

// --- in-memory reference provider (for tests & local dev) ------------------

function makeInMemoryProvider(): EncryptProvider {
  // "Ciphertext" is just a big-endian u64 XORed with a per-session key —
  // enough to prove the data flow, not a real FHE scheme.
  const sessionKey = new Uint8Array(8);
  for (let i = 0; i < 8; i++) sessionKey[i] = (Math.random() * 256) | 0;

  const toCt = (v: bigint): EncU64 => {
    const buf = new Uint8Array(8);
    const view = new DataView(buf.buffer);
    view.setBigUint64(0, v, false);
    for (let i = 0; i < 8; i++) buf[i] ^= sessionKey[i];
    return { bytes: buf };
  };
  const fromCt = (ct: EncU64): bigint => {
    const buf = new Uint8Array(ct.bytes);
    for (let i = 0; i < 8; i++) buf[i] ^= sessionKey[i];
    const view = new DataView(buf.buffer);
    return view.getBigUint64(0, false);
  };

  return {
    async encryptU64(v) {
      return toCt(v);
    },
    async decryptU64(ct) {
      return fromCt(ct);
    },
    async fheAdd(a, b) {
      return toCt(fromCt(a) + fromCt(b));
    },
    async fheGt(a, b) {
      const bit = fromCt(a) > fromCt(b) ? 1n : 0n;
      return { bytes: toCt(bit).bytes };
    },
  };
}
