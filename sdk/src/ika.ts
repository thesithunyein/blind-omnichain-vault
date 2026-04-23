/**
 * Client-side wrapper around Ika's dWallet pre-alpha devnet.
 *
 * A dWallet is a 2-of-2 signing object where one share is the user's and the
 * other is the policy share bound to a Solana PDA. This module:
 *
 *   - creates dWallets on a given chain (BTC, ETH, ...),
 *   - produces partial user-share signatures,
 *   - submits them along with the Solana `approve_dwallet_sign` tx so Ika's
 *     2PC-MPC network can complete the signature.
 *
 * The stub below captures the public API shape we depend on. Swap the body
 * for real Ika SDK calls once the devnet endpoint is wired.
 *
 * Live demo: https://blind-omnichain-vault.vercel.app
 * Program:   6jkfCwYGm33xFqBfajHHWxcnG1YJzm2Jd7cME2jUNaaf (Solana devnet)
 */

import { PublicKey } from "@solana/web3.js";
import { DWalletChain } from "./types";

export interface DWallet {
  /** 32-byte dWallet id (Ika-internal). */
  id: Uint8Array;
  /** Foreign-chain address (base58/bech32/hex depending on chain). */
  foreignAddress: string;
  chain: DWalletChain;
  /** Solana PDA that holds the policy share. */
  policyPda: PublicKey;
}

export interface PreparedSignRequest {
  dwalletId: Uint8Array;
  txDigest: Uint8Array;      // 32 bytes
  userPartialSig: Uint8Array; // user-share partial signature blob
  destChain: DWalletChain;
}

export interface IkaProvider {
  createDWallet(chain: DWalletChain, policyPda: PublicKey): Promise<DWallet>;
  /** Prepare a native-chain transaction (e.g. BTC p2wpkh spend) and return its digest. */
  prepareTransferTx(
    from: DWallet,
    toForeignAddress: string,
    amountBaseUnits: bigint,
  ): Promise<{ txDigest: Uint8Array; rawTx: Uint8Array }>;
  /** Produce the user-share partial signature for a prepared digest. */
  signUserShare(digest: Uint8Array): Promise<Uint8Array>;
  /** Broadcast the fully-signed raw tx on the destination chain. */
  broadcast(chain: DWalletChain, rawTxWithSig: Uint8Array): Promise<string>;
}

let _provider: IkaProvider | null = null;

export function attachIkaProvider(p: IkaProvider) {
  _provider = p;
}

export function ikaProvider(): IkaProvider {
  if (!_provider) _provider = makeMockIkaProvider();
  return _provider;
}

// --- mock provider ---------------------------------------------------------

function makeMockIkaProvider(): IkaProvider {
  return {
    async createDWallet(chain, policyPda) {
      const id = new Uint8Array(32);
      crypto.getRandomValues(id);
      const foreignAddress = mockAddressFor(chain, id);
      return { id, foreignAddress, chain, policyPda };
    },
    async prepareTransferTx(from, to, amount) {
      const payload = `${Buffer.from(from.id).toString("hex")}|${to}|${amount}`;
      const digestBuf = await sha256(new TextEncoder().encode(payload));
      return { txDigest: new Uint8Array(digestBuf), rawTx: new Uint8Array(digestBuf) };
    },
    async signUserShare(digest) {
      const out = new Uint8Array(64);
      out.set(digest.slice(0, 32), 0);
      out.set(digest.slice(0, 32), 32);
      return out;
    },
    async broadcast(chain, raw) {
      return `mocktx-${DWalletChain[chain]}-${Buffer.from(raw.slice(0, 8)).toString("hex")}`;
    },
  };
}

function mockAddressFor(chain: DWalletChain, id: Uint8Array): string {
  const hex = Buffer.from(id).toString("hex");
  switch (chain) {
    case DWalletChain.Bitcoin:
      return `bc1q${hex.slice(0, 38)}`;
    case DWalletChain.Ethereum:
      return `0x${hex.slice(0, 40)}`;
    case DWalletChain.Sui:
      return `0x${hex}`;
    case DWalletChain.Zcash:
      return `zs1${hex.slice(0, 40)}`;
    case DWalletChain.Cosmos:
      return `cosmos1${hex.slice(0, 38)}`;
    case DWalletChain.Solana:
      return hex.slice(0, 44);
  }
}

async function sha256(data: Uint8Array): Promise<ArrayBuffer> {
  // Works in Node 20+ and browser. Copy into a fresh ArrayBuffer so the
  // input satisfies WebCrypto's BufferSource contract across lib.dom variants.
  const buf = new ArrayBuffer(data.byteLength);
  new Uint8Array(buf).set(data);
  const subtle =
    (globalThis.crypto && (globalThis.crypto as Crypto).subtle) ||
    ((await import("crypto")).webcrypto.subtle);
  return subtle.digest("SHA-256", buf);
}
