/**
 * Blind Omnichain Vault — Anchor program client
 *
 * Live demo: https://blind-omnichain-vault.vercel.app
 * Program:   see PROGRAM_ID below — update after Solana Playground deploy
 */
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, Connection, SystemProgram } from "@solana/web3.js";

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

// ─── IDL (matches programs/bov/src/lib.rs exactly) ───────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BOV_IDL: any = {
  version: "0.1.0",
  name: "bov",
  instructions: [
    {
      name: "initializeVault",
      accounts: [
        { name: "vault",         isMut: true,  isSigner: false },
        { name: "authority",     isMut: true,  isSigner: true  },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "vaultId",           type: "u64" },
        { name: "encTargetWeights",  type: { vec: { vec: "u8" } } },
        { name: "encRebalanceBand",  type: { vec: "u8" } },
        { name: "supportedChains",   type: { vec: "u8" } },
      ],
    },
    {
      name: "registerDwallet",
      accounts: [
        { name: "vault",         isMut: true,  isSigner: false },
        { name: "registryEntry", isMut: true,  isSigner: false },
        { name: "authority",     isMut: true,  isSigner: true  },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "chain",          type: "u8" },
        { name: "dwalletId",      type: { array: ["u8", 32] } },
        { name: "foreignAddress", type: { vec: "u8" } },
      ],
    },
    {
      name: "deposit",
      accounts: [
        { name: "vault",         isMut: true,  isSigner: false },
        { name: "userLedger",    isMut: true,  isSigner: false },
        { name: "chainBalance",  isMut: true,  isSigner: false },
        { name: "user",          isMut: true,  isSigner: true  },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "chain",           type: "u8" },
        { name: "encryptedAmount", type: { vec: "u8" } },
      ],
    },
    {
      name: "requestRebalance",
      accounts: [
        { name: "vault",   isMut: true,  isSigner: false },
        { name: "cranker", isMut: false, isSigner: true  },
      ],
      args: [
        { name: "fromChain",      type: "u8" },
        { name: "toChain",        type: "u8" },
        { name: "preparedDigest", type: { array: ["u8", 32] } },
      ],
    },
    {
      name: "withdraw",
      accounts: [
        { name: "vault",      isMut: false, isSigner: false },
        { name: "userLedger", isMut: true,  isSigner: false },
        { name: "user",       isMut: true,  isSigner: true  },
      ],
      args: [
        { name: "chain", type: "u8" },
      ],
    },
    {
      name: "setPaused",
      accounts: [
        { name: "vault",     isMut: true,  isSigner: false },
        { name: "authority", isMut: false, isSigner: true  },
      ],
      args: [{ name: "paused", type: "bool" }],
    },
  ],
  accounts: [
    {
      name: "Vault",
      type: {
        kind: "struct",
        fields: [
          { name: "vaultId",          type: "u64"              },
          { name: "authority",         type: "publicKey"        },
          { name: "bump",              type: "u8"               },
          { name: "paused",            type: "bool"             },
          { name: "dwalletCount",      type: "u8"               },
          { name: "totalDepositors",   type: "u64"              },
          { name: "totalRebalances",   type: "u64"              },
          { name: "supportedChains",   type: { vec: "u8" }      },
          { name: "encTargetWeights",  type: { vec: { vec: "u8" } } },
          { name: "encRebalanceBand",  type: { vec: "u8" }      },
          { name: "encNav",            type: { vec: "u8" }      },
        ],
      },
    },
    {
      name: "UserLedger",
      type: {
        kind: "struct",
        fields: [
          { name: "owner",        type: "publicKey"   },
          { name: "vault",        type: "publicKey"   },
          { name: "encShares",    type: { vec: "u8" } },
          { name: "depositCount", type: "u64"         },
          { name: "bump",         type: "u8"          },
        ],
      },
    },
    {
      name: "ChainBalance",
      type: {
        kind: "struct",
        fields: [
          { name: "vault",       type: "publicKey"   },
          { name: "chain",       type: "u8"          },
          { name: "encBalance",  type: { vec: "u8" } },
          { name: "bump",        type: "u8"          },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "ChainWeightMismatch", msg: "Chain and weight vectors have different lengths." },
    { code: 6001, name: "TooManyChains",       msg: "Too many chains configured for this vault." },
    { code: 6002, name: "ChainNotSupported",   msg: "Chain is not supported by this vault." },
    { code: 6003, name: "TooManyDWallets",     msg: "Too many dWallets already registered." },
    { code: 6004, name: "AddressTooLong",      msg: "Foreign address exceeds max length." },
    { code: 6005, name: "VaultPaused",         msg: "Vault is paused." },
    { code: 6006, name: "Unauthorized",        msg: "Caller is not authorised." },
    { code: 6007, name: "EmptyCiphertext",     msg: "Ciphertext is empty." },
    { code: 6008, name: "CiphertextTooLarge",  msg: "Ciphertext exceeds maximum size." },
  ],
  metadata: { address: PROGRAM_ID.toBase58() },
};

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

// ─── Ciphertext stub: XOR-encrypt the amount with a nonce for demo purposes ──
// Production: Encrypt REFHE client-side encryption
export function stubEncrypt(amount: number): Buffer {
  const nonce = crypto.getRandomValues(new Uint8Array(16));
  const buf   = Buffer.alloc(32);
  const amtBuf = Buffer.alloc(8);
  amtBuf.writeBigUInt64LE(BigInt(amount));
  for (let i = 0; i < 8; i++)  buf[i]      = amtBuf[i]  ^ nonce[i % 16];
  for (let i = 0; i < 16; i++) buf[8 + i]  = nonce[i];
  // zero-pad remaining
  return buf;
}

// ─── Solscan TX link (devnet) ─────────────────────────────────────────────────
export function solscanTxUrl(sig: string): string {
  return `https://solscan.io/tx/${sig}?cluster=devnet`;
}
export function solscanAccountUrl(addr: string): string {
  return `https://solscan.io/account/${addr}?cluster=devnet`;
}
export function shortSig(sig: string): string {
  return sig.slice(0, 6) + "…" + sig.slice(-4);
}
export function shortAddress(addr: string): string {
  return addr.slice(0, 4) + "…" + addr.slice(-4);
}

// ─── Vault initialization helper ─────────────────────────────────────────────
// Returns true if the program is deployed and executable on devnet.
export async function isProgramDeployed(): Promise<boolean> {
  try {
    const info = await CONNECTION.getAccountInfo(PROGRAM_ID);
    return info !== null && info.executable === true;
  } catch {
    return false;
  }
}

// Returns true if the vault PDA account exists on-chain.
export async function vaultExists(vaultPda: PublicKey): Promise<boolean> {
  const info = await CONNECTION.getAccountInfo(vaultPda);
  return info !== null;
}

// Initialize vault for the connected wallet (called once automatically).
export async function ensureVault(
  program: Program,
  authority: PublicKey,
): Promise<string | null> {
  const [vault] = getVaultPda(authority, VAULT_ID);
  if (await vaultExists(vault)) return null;

  // Stub ciphertexts for demo. Production: real Encrypt FHE ciphertexts.
  // Args match lib.rs: initialize_vault(vault_id, enc_target_weights, enc_rebalance_band, supported_chains)
  const encWeights = [[60], [25], [10], [5]]; // 4 x 1-byte stub ciphertexts (BTC 60%, ETH 25%, SUI 10%, ZEC 5%)
  const encBand    = [5];                      // 1-byte stub: 5% band
  const chains     = [0, 1, 2, 3];            // Bitcoin=0, Ethereum=1, Sui=2, Zcash=3

  const sig = await (program.methods as any)
    .initializeVault(
      VAULT_ID,   // u64
      encWeights, // Vec<Vec<u8>>
      encBand,    // Vec<u8>
      chains,     // Vec<u8>
    )
    .accounts({
      vault,
      authority,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  return sig;
}

// ─── Program factory ─────────────────────────────────────────────────────────
// Cast constructor to support both Anchor 0.30 (idl, provider) and legacy
// (idl, programId, provider) — at runtime Anchor 0.30 checks if the second
// arg is a PublicKey and treats it as the legacy programId path.
export function getBovProgram(provider: AnchorProvider): Program {
  return new (Program as any)(BOV_IDL, PROGRAM_ID, provider) as Program;
}
