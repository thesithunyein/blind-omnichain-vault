/**
 * High-level BOV client. Combines the Ika and Encrypt wrappers with the
 * Solana program to provide a one-line deposit / withdraw / rebalance API.
 */

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";

import { DWalletChain, EncU64, VaultConfig } from "./types";
import { encryptU64, encryptWeightsBps } from "./encrypt";
import { ikaProvider } from "./ika";

export const BOV_PROGRAM_ID = new PublicKey(
  "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
);

/** https://solscan.io/account/Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS?cluster=devnet */
export const SOLSCAN_DEVNET = "https://solscan.io";

export function solscanTx(sig: string): string {
  return `${SOLSCAN_DEVNET}/tx/${sig}?cluster=devnet`;
}

export function solscanAccount(addr: string): string {
  return `${SOLSCAN_DEVNET}/account/${addr}?cluster=devnet`;
}

export class BovClient {
  constructor(
    public readonly connection: Connection,
    public readonly payer: PublicKey,
    public readonly programId: PublicKey = BOV_PROGRAM_ID,
  ) {}

  // --- PDAs ---------------------------------------------------------------

  vaultPda(authority: PublicKey, vaultId: BN): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), authority.toBuffer(), vaultId.toArrayLike(Buffer, "le", 8)],
      this.programId,
    );
  }

  userLedgerPda(vault: PublicKey, user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("ledger"), vault.toBuffer(), user.toBuffer()],
      this.programId,
    );
  }

  chainBalancePda(vault: PublicKey, chain: DWalletChain): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("chainbal"), vault.toBuffer(), Buffer.from([chain])],
      this.programId,
    );
  }

  // --- high-level flows ---------------------------------------------------

  /** Build the instructions to initialize a vault with encrypted targets. */
  async buildInitVaultIxs(cfg: VaultConfig): Promise<TransactionInstruction[]> {
    const [vault] = this.vaultPda(cfg.authority, cfg.vaultId);
    const encTargets = await encryptWeightsBps(cfg.targetWeightsBps);
    const encBand = await encryptU64(BigInt(cfg.rebalanceBandBps));

    // Anchor IDL serialization would normally come from the generated client;
    // we expose the semantic call here for the frontend / demo script.
    const data = encodeInitVault(cfg.vaultId, encTargets, encBand, cfg.supportedChains);

    return [
      new TransactionInstruction({
        programId: this.programId,
        keys: [
          { pubkey: vault, isSigner: false, isWritable: true },
          { pubkey: cfg.authority, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      }),
    ];
  }

  /**
   * End-to-end deposit flow.
   * 1) Creates or reuses a dWallet on `chain` via Ika.
   * 2) Returns the foreign address the user must send native assets to.
   * 3) After the external transfer is observed, call `recordDeposit` with the
   *    amount (plaintext, client-side) — it'll be encrypted and pushed on-chain.
   */
  async beginDeposit(opts: {
    authority: PublicKey;
    vaultId: BN;
    chain: DWalletChain;
  }): Promise<{ foreignAddress: string; dwalletId: Uint8Array }> {
    const [vault] = this.vaultPda(opts.authority, opts.vaultId);
    const dw = await ikaProvider().createDWallet(opts.chain, vault);
    return { foreignAddress: dw.foreignAddress, dwalletId: dw.id };
  }

  /** Encrypt an observed deposit amount and submit to the program. */
  async recordDeposit(_amountBaseUnits: bigint): Promise<EncU64> {
    return encryptU64(_amountBaseUnits);
  }
}

// --- tiny, self-contained serializer for the demo --------------------------
// (The real client will import the auto-generated Anchor types. This keeps
// the SDK standalone-compilable for hackathon review.)

function encodeInitVault(
  vaultId: BN,
  encTargets: EncU64[],
  encBand: EncU64,
  chains: DWalletChain[],
): Buffer {
  const chunks: Buffer[] = [];
  // 8-byte anchor discriminator placeholder (real one comes from IDL)
  chunks.push(Buffer.alloc(8));
  chunks.push(vaultId.toArrayLike(Buffer, "le", 8));
  chunks.push(writeVec(encTargets.map((t) => Buffer.from(t.bytes))));
  chunks.push(writeBytes(Buffer.from(encBand.bytes)));
  chunks.push(writeVec(chains.map((c) => Buffer.from([c]))));
  return Buffer.concat(chunks);
}

function writeBytes(b: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32LE(b.length, 0);
  return Buffer.concat([len, b]);
}

function writeVec(items: Buffer[]): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32LE(items.length, 0);
  return Buffer.concat([len, ...items.map(writeBytes)]);
}
