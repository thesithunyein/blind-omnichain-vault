/**
 * End-to-end demo — runs against the in-memory reference providers so it
 * works without a live Solana validator, Ika devnet, or Encrypt devnet.
 *
 *   pnpm demo
 *
 * Live demo UI: https://blind-omnichain-vault.vercel.app
 *
 * Demonstrates the *data flow* of a Blind Omnichain Vault:
 *   1. Init vault with encrypted target weights.
 *   2. User begins a BTC deposit → Ika creates a dWallet, returns a BTC address.
 *   3. User "sends" native BTC to that address (simulated).
 *   4. Client encrypts the observed amount and "records" it on-chain.
 *   5. A cranker evaluates the FHE rebalance policy and triggers a dWallet
 *      sign via Ika — Solana approves only if the encrypted guard is true.
 *   6. User withdraws — only their share is threshold-decrypted.
 */

import BN from "bn.js";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import {
  BovClient,
  DWalletChain,
  decryptU64,
  encryptU64,
  ikaProvider,
} from "../sdk/src";

async function main() {
  console.log("🔒 Blind Omnichain Vault — demo");
  console.log("----------------------------------");

  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const authority = Keypair.generate();
  const alice = Keypair.generate();

  const client = new BovClient(connection, authority.publicKey);
  const vaultId = new BN(1);

  // 1) init
  await client.buildInitVaultIxs({
    authority: authority.publicKey,
    vaultId,
    supportedChains: [DWalletChain.Bitcoin, DWalletChain.Ethereum],
    targetWeightsBps: [6000, 4000], // 60% BTC / 40% ETH
    rebalanceBandBps: 300,          // ±3%
  });
  console.log("✅ vault init ix built (encrypted weights, band)");

  // 2) begin deposit
  const { foreignAddress, dwalletId } = await client.beginDeposit({
    authority: authority.publicKey,
    vaultId,
    chain: DWalletChain.Bitcoin,
  });
  console.log(`✅ Ika dWallet created — send native BTC to ${foreignAddress}`);

  // 3) simulate BTC transfer (external). 0.5 BTC = 50_000_000 sats.
  const amountSats = 50_000_000n;

  // 4) encrypt + "record" the observed amount
  const encAmount = await encryptU64(amountSats);
  console.log(
    `✅ encrypted deposit ciphertext (${encAmount.bytes.length} bytes) ready to submit`,
  );

  // 5) rebalance demo — pretend current BTC weight drifted
  const _ika = ikaProvider();
  const prep = await _ika.prepareTransferTx(
    { id: dwalletId, foreignAddress, chain: DWalletChain.Bitcoin, policyPda: PublicKey.default },
    "bc1qdestination0000000000000000000000000000",
    10_000_000n,
  );
  console.log(
    `✅ prepared cross-chain tx digest=${Buffer.from(prep.txDigest).toString("hex").slice(0, 16)}…`,
  );
  console.log("   (Solana would now check FHE guard and issue approve_dwallet_sign CPI)");

  // 6) withdraw — threshold-decrypt the user's share only
  const userEncShare = await encryptU64(amountSats); // in reality loaded from ledger
  const plaintext = await decryptU64(userEncShare);
  console.log(`✅ Alice's decrypted share: ${plaintext} sats (others remain encrypted)`);

  console.log("----------------------------------");
  console.log("🎉 demo complete — swap stubs for devnet endpoints to go live.");
  void alice;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
