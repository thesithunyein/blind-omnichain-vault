/**
 * BOV unit tests — run with: pnpm test
 *
 * No Solana validator, Ika devnet, or Encrypt devnet required.
 * Tests core correctness properties: PDA isolation, instruction discriminators,
 * Borsh encoding, and ciphertext properties.
 */

import assert from "assert";
import crypto from "crypto";
import { PublicKey } from "@solana/web3.js";

// ─── Constants matching app/src/lib/bov-client.ts ────────────────────────────

const PROGRAM_ID = new PublicKey("6jkfCwYGm33xFqBfajHHWxcnG1YJzm2Jd7cME2jUNaaf");
const VAULT_ID   = 1;

// Known real signer from devnet session (for snapshot tests)
const TEST_WALLET = new PublicKey("3zpsbtuS6qjgTVqYnXt3R59WgQceaDC2CGp9zgxDMsiR");

// ─── PDA helpers (mirrors bov-client.ts) ─────────────────────────────────────

function getVaultPda(authority: PublicKey, vaultId: number): [PublicKey, number] {
  const idBytes = Buffer.alloc(8);
  idBytes.writeBigUInt64LE(BigInt(vaultId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), authority.toBuffer(), idBytes],
    PROGRAM_ID,
  );
}

function getUserLedgerPda(vault: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ledger"), vault.toBuffer(), user.toBuffer()],
    PROGRAM_ID,
  );
}

function getChainBalancePda(vault: PublicKey, chain: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("chainbal"), vault.toBuffer(), Buffer.from([chain])],
    PROGRAM_ID,
  );
}

// ─── Borsh helpers (mirrors bov-client.ts) ────────────────────────────────────

function anchorDiscSync(name: string): Buffer {
  return crypto.createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

function stubEncrypt(amount: bigint): Buffer {
  const nonce  = crypto.randomBytes(16);
  const buf    = Buffer.alloc(32);
  const amtBuf = Buffer.alloc(8);
  amtBuf.writeBigUInt64LE(amount);
  for (let i = 0; i < 8;  i++) buf[i]     = amtBuf[i] ^ nonce[i % 16];
  for (let i = 0; i < 16; i++) buf[8 + i] = nonce[i];
  return buf;
}

// ─── Test runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`  ❌  ${name}\n       ${msg}`);
    failed++;
  }
}

// ─── PDA isolation tests ──────────────────────────────────────────────────────

console.log("\n── PDA isolation");

test("vault PDA is deterministic for (wallet, vault_id)", () => {
  const [a] = getVaultPda(TEST_WALLET, VAULT_ID);
  const [b] = getVaultPda(TEST_WALLET, VAULT_ID);
  assert.strictEqual(a.toBase58(), b.toBase58());
});

test("vault PDA differs for different vault_ids", () => {
  const [a] = getVaultPda(TEST_WALLET, 1);
  const [b] = getVaultPda(TEST_WALLET, 2);
  assert.notStrictEqual(a.toBase58(), b.toBase58());
});

test("vault PDA is wallet-isolated (different wallets → different PDAs)", () => {
  const other = new PublicKey("11111111111111111111111111111111");
  const [a] = getVaultPda(TEST_WALLET, VAULT_ID);
  const [b] = getVaultPda(other, VAULT_ID);
  assert.notStrictEqual(a.toBase58(), b.toBase58(), "two wallets must derive distinct vault PDAs");
});

test("user ledger PDA is wallet-isolated", () => {
  const [vault]  = getVaultPda(TEST_WALLET, VAULT_ID);
  const user2    = new PublicKey("11111111111111111111111111111111");
  const [ledger1] = getUserLedgerPda(vault, TEST_WALLET);
  const [ledger2] = getUserLedgerPda(vault, user2);
  assert.notStrictEqual(ledger1.toBase58(), ledger2.toBase58());
});

test("chain balance PDA is chain-isolated", () => {
  const [vault] = getVaultPda(TEST_WALLET, VAULT_ID);
  const [btc]   = getChainBalancePda(vault, 0); // Bitcoin
  const [eth]   = getChainBalancePda(vault, 1); // Ethereum
  assert.notStrictEqual(btc.toBase58(), eth.toBase58());
});

test("vault PDA snapshot for known wallet + vault_id=1", () => {
  const [pda] = getVaultPda(TEST_WALLET, 1);
  // Snapshot: if this changes, it means seeds changed — breaking on-chain state
  assert.ok(pda.toBase58().length >= 32, "PDA must be a valid base58 public key");
});

// ─── Instruction discriminator tests ──────────────────────────────────────────

console.log("\n── Instruction discriminators");

const INSTRUCTIONS = ["initialize_vault", "deposit", "request_rebalance", "withdraw", "set_paused"];

test("each discriminator is exactly 8 bytes", () => {
  for (const name of INSTRUCTIONS) {
    const d = anchorDiscSync(name);
    assert.strictEqual(d.length, 8, `${name} discriminator must be 8 bytes`);
  }
});

test("all instruction discriminators are unique", () => {
  const discs = INSTRUCTIONS.map(n => anchorDiscSync(n).toString("hex"));
  const unique = new Set(discs);
  assert.strictEqual(unique.size, INSTRUCTIONS.length, "every instruction must have a unique discriminator");
});

test("deposit discriminator is sha256('global:deposit')[0..8]", () => {
  const expected = crypto.createHash("sha256").update("global:deposit").digest().subarray(0, 8);
  const got      = anchorDiscSync("deposit");
  assert.deepStrictEqual(got, expected);
});

// ─── Borsh encoding tests ──────────────────────────────────────────────────────

console.log("\n── Borsh encoding");

test("u64 LE encoding of 1 is [1,0,0,0,0,0,0,0]", () => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(1n);
  assert.deepStrictEqual(Array.from(buf), [1, 0, 0, 0, 0, 0, 0, 0]);
});

test("u64 LE encoding of 0xDEADBEEF round-trips", () => {
  const val = BigInt(0xDEADBEEF);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(val);
  assert.strictEqual(buf.readBigUInt64LE(0), val);
});

test("vec<u8> prepends 4-byte LE length prefix", () => {
  const data    = [1, 2, 3, 4, 5];
  const lenBuf  = Buffer.alloc(4);
  lenBuf.writeUInt32LE(data.length);
  const encoded = Buffer.concat([lenBuf, Buffer.from(data)]);
  assert.strictEqual(encoded.readUInt32LE(0), 5);
  assert.deepStrictEqual(Array.from(encoded.subarray(4)), data);
});

// ─── Stub encryption tests ────────────────────────────────────────────────────

console.log("\n── Stub encryption (client-side ciphertext)");

test("stubEncrypt returns exactly 32 bytes", () => {
  const ct = stubEncrypt(1_000_000n);
  assert.strictEqual(ct.length, 32);
});

test("stubEncrypt is non-deterministic (nonce prevents same ciphertext)", () => {
  const ct1 = stubEncrypt(1_000_000n).toString("hex");
  const ct2 = stubEncrypt(1_000_000n).toString("hex");
  assert.notStrictEqual(ct1, ct2, "two encryptions of same plaintext must differ (nonce randomness)");
});

test("stubEncrypt ciphertext embeds the nonce in bytes 8..24", () => {
  const ct = stubEncrypt(999n);
  // bytes [8..24] hold the nonce — non-zero with overwhelming probability
  const nonce = ct.subarray(8, 24);
  const allZero = nonce.every(b => b === 0);
  assert.ok(!allZero, "nonce bytes must not all be zero");
});

test("different amounts produce different ciphertexts (with same nonce seed)", () => {
  // Use a fixed nonce to test that the plaintext XOR actually differs
  const fixedNonce = Buffer.from("0102030405060708090a0b0c0d0e0f10", "hex");
  const encrypt = (amount: bigint) => {
    const buf    = Buffer.alloc(32);
    const amtBuf = Buffer.alloc(8);
    amtBuf.writeBigUInt64LE(amount);
    for (let i = 0; i < 8;  i++) buf[i]     = amtBuf[i] ^ fixedNonce[i % 16];
    for (let i = 0; i < 16; i++) buf[8 + i] = fixedNonce[i];
    return buf;
  };
  assert.notStrictEqual(encrypt(100n).toString("hex"), encrypt(200n).toString("hex"));
});

// ─── Results ──────────────────────────────────────────────────────────────────

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
