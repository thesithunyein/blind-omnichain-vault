/**
 * Blind Omnichain Vault — program client
 *
 * Uses raw @solana/web3.js + browser Web Crypto API for instruction building.
 * No @coral-xyz/anchor client dependency — avoids the _bn serialization bug
 * that occurs when Anchor 0.30 tries to parse a legacy-format IDL in Next.js.
 *
 * Live demo: https://blind-omnichain-vault.vercel.app
 * Program:   6jkfCwYGm33xFqBfajHHWxcnG1YJzm2Jd7cME2jUNaaf (Solana devnet)
 */
import {
  PublicKey, Connection, SystemProgram,
  Transaction, TransactionInstruction,
} from "@solana/web3.js";

// ─── Update this after deploying via Solana Playground ───────────────────────
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_BOV_PROGRAM_ID ??
  "6jkfCwYGm33xFqBfajHHWxcnG1YJzm2Jd7cME2jUNaaf"
);

// Each connected wallet is its own vault authority for the demo.
// Production: vault authority would be a multisig/DAO.
export const VAULT_ID = 1; // plain number; Anchor handles u64 serialization

// Derive the vault PDA for a specific wallet (self-service demo).
export function getVaultPdaForWallet(wallet: PublicKey): [PublicKey, number] {
  return getVaultPda(wallet, VAULT_ID);
}

export const CONNECTION = new Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);

// Chain discriminants matching the on-chain enum
export const CHAIN = {
  Bitcoin:  0,
  Ethereum: 1,
  Sui:      2,
  Solana:   3,
  Zcash:    4,
  Cosmos:   5,
} as const;

export type ChainName = keyof typeof CHAIN;

// ─── PDA helpers ─────────────────────────────────────────────────────────────

export function getVaultPda(authority: PublicKey, vaultId: number): [PublicKey, number] {
  const idBytes = Buffer.alloc(8);
  idBytes.writeBigUInt64LE(BigInt(vaultId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), authority.toBuffer(), idBytes],
    PROGRAM_ID
  );
}

export function getUserLedgerPda(vault: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ledger"), vault.toBuffer(), user.toBuffer()],
    PROGRAM_ID
  );
}

export function getChainBalancePda(vault: PublicKey, chain: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("chainbal"), vault.toBuffer(), Buffer.from([chain])],
    PROGRAM_ID
  );
}

// ─── Borsh micro-helpers (no external dependency) ────────────────────────────

function u8b(val: number): Buffer { return Buffer.from([val]); }
function u32LE(val: number): Buffer { const b = Buffer.alloc(4); b.writeUInt32LE(val); return b; }
function u64LE(val: number): Buffer { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(val)); return b; }
function vecU8(data: number[] | Uint8Array): Buffer {
  return Buffer.concat([u32LE(data.length), Buffer.from(data)]);
}
function vecVecU8(rows: number[][]): Buffer {
  return Buffer.concat([u32LE(rows.length), ...rows.map(vecU8)]);
}

// Compute Anchor instruction discriminator: sha256("global:<name>")[0..8]
// Uses the Web Crypto API — available in all modern browsers and Node 18+.
async function anchorDisc(name: string): Promise<Buffer> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`global:${name}`)
  );
  return Buffer.from(new Uint8Array(hash, 0, 8));
}

// ─── Wallet interface (subset of AnchorWallet / WalletContextState) ───────────
export type SolWallet = {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
};

// ─── Raw instruction builders ─────────────────────────────────────────────────

export async function buildInitVaultIx(
  vault: PublicKey,
  authority: PublicKey,
): Promise<TransactionInstruction> {
  const data = Buffer.concat([
    await anchorDisc("initialize_vault"),
    u64LE(VAULT_ID),                        // vault_id: u64
    vecVecU8([[60], [25], [10], [5]]),       // enc_target_weights: Vec<Vec<u8>> stub
    vecU8([5]),                              // enc_rebalance_band: Vec<u8> stub
    vecU8([0, 1, 2, 3]),                    // supported_chains: Vec<u8>
  ]);
  return new TransactionInstruction({
    keys: [
      { pubkey: vault,                   isWritable: true,  isSigner: false },
      { pubkey: authority,               isWritable: true,  isSigner: true  },
      { pubkey: SystemProgram.programId, isWritable: false, isSigner: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

export async function buildDepositIx(
  vault: PublicKey,
  userLedger: PublicKey,
  chainBalance: PublicKey,
  user: PublicKey,
  chain: number,
  encryptedAmount: number[],
): Promise<TransactionInstruction> {
  const data = Buffer.concat([
    await anchorDisc("deposit"),
    u8b(chain),             // chain: u8
    vecU8(encryptedAmount), // encrypted_amount: Vec<u8>
  ]);
  return new TransactionInstruction({
    keys: [
      { pubkey: vault,                   isWritable: true,  isSigner: false },
      { pubkey: userLedger,              isWritable: true,  isSigner: false },
      { pubkey: chainBalance,            isWritable: true,  isSigner: false },
      { pubkey: user,                    isWritable: true,  isSigner: true  },
      { pubkey: SystemProgram.programId, isWritable: false, isSigner: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

export async function buildRebalanceIx(
  vault: PublicKey,
  cranker: PublicKey,
  fromChain: number,
  toChain: number,
  digest: Uint8Array,
): Promise<TransactionInstruction> {
  const data = Buffer.concat([
    await anchorDisc("request_rebalance"),
    u8b(fromChain),      // from_chain: u8
    u8b(toChain),        // to_chain: u8
    Buffer.from(digest), // prepared_digest: [u8; 32]
  ]);
  return new TransactionInstruction({
    keys: [
      { pubkey: vault,    isWritable: true,  isSigner: false },
      { pubkey: cranker,  isWritable: false, isSigner: true  },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

export async function buildWithdrawIx(
  vault: PublicKey,
  userLedger: PublicKey,
  user: PublicKey,
  chain: number,
): Promise<TransactionInstruction> {
  const data = Buffer.concat([
    await anchorDisc("withdraw"),
    u8b(chain), // chain: u8
  ]);
  return new TransactionInstruction({
    keys: [
      { pubkey: vault,       isWritable: false, isSigner: false },
      { pubkey: userLedger,  isWritable: true,  isSigner: false },
      { pubkey: user,        isWritable: true,  isSigner: true  },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

// ─── Send and confirm helper ──────────────────────────────────────────────────

export async function sendAndConfirm(
  ixs: TransactionInstruction | TransactionInstruction[],
  wallet: SolWallet,
): Promise<string> {
  const tx = new Transaction();
  const instructions = Array.isArray(ixs) ? ixs : [ixs];
  for (const ix of instructions) tx.add(ix);
  tx.feePayer = wallet.publicKey;
  const { blockhash } = await CONNECTION.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  const signed = await wallet.signTransaction(tx);
  const sig = await CONNECTION.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  await CONNECTION.confirmTransaction(sig, "confirmed");
  return sig;
}

// ─── On-chain account helpers ─────────────────────────────────────────────────

export async function isProgramDeployed(): Promise<boolean> {
  try {
    const info = await CONNECTION.getAccountInfo(PROGRAM_ID);
    return info !== null && info.executable === true;
  } catch {
    return false;
  }
}

export async function vaultExists(vaultPda: PublicKey): Promise<boolean> {
  const info = await CONNECTION.getAccountInfo(vaultPda);
  return info !== null;
}

// Auto-initialize vault for wallet on first deposit.
export async function ensureVault(vault: PublicKey, wallet: SolWallet): Promise<string | null> {
  if (await vaultExists(vault)) return null;
  const ix = await buildInitVaultIx(vault, wallet.publicKey);
  return sendAndConfirm(ix, wallet);
}

// Decode UserLedger Borsh layout: 8-disc | 32 vault | 32 owner | 4 count | 4+n encShares | 1 bump
export function decodeUserLedger(data: Buffer): { depositCount: number; encShares: number[] } | null {
  try {
    let o = 8 + 32 + 32;                           // skip discriminator + vault + owner
    const depositCount = data.readUInt32LE(o); o += 4;
    const len          = data.readUInt32LE(o); o += 4;
    const encShares    = Array.from(data.subarray(o, o + len));
    return { depositCount, encShares };
  } catch {
    return null;
  }
}

// ─── Stub encryption ──────────────────────────────────────────────────────────
// Production: Encrypt REFHE client-side SDK
export function stubEncrypt(amount: number): Buffer {
  const nonce  = crypto.getRandomValues(new Uint8Array(16));
  const buf    = Buffer.alloc(32);
  const amtBuf = Buffer.alloc(8);
  amtBuf.writeBigUInt64LE(BigInt(amount));
  for (let i = 0; i < 8;  i++) buf[i]     = amtBuf[i] ^ nonce[i % 16];
  for (let i = 0; i < 16; i++) buf[8 + i] = nonce[i];
  return buf;
}

// ─── Solscan helpers ──────────────────────────────────────────────────────────
export function solscanTxUrl(sig: string):    string { return `https://solscan.io/tx/${sig}?cluster=devnet`; }
export function solscanAccountUrl(addr: string): string { return `https://solscan.io/account/${addr}?cluster=devnet`; }
export function shortSig(sig: string):        string { return sig.slice(0, 6) + "…" + sig.slice(-4); }
export function shortAddress(addr: string):   string { return addr.slice(0, 4) + "…" + addr.slice(-4); }
