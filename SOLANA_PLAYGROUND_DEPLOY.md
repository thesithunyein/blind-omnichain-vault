# Solana Playground Deploy Guide

Deploy the BOV program to devnet in ~5 minutes — no local CLI required.

---

## Prerequisites

- Browser wallet (Phantom / Backpack) with **≥ 2 SOL on devnet**
  - Get devnet SOL: `https://faucet.solana.com` → paste your wallet address → "Airdrop 2 SOL"

---

## Step 1 — Open Solana Playground

Go to **[https://beta.solpg.io](https://beta.solpg.io)** and click **"Create a new project"**.

---

## Step 2 — Paste the program

1. Delete the default `lib.rs` content.
2. Open `programs/bov/src/lib.rs` from this repo and **copy the entire file**.
3. Paste it into the Playground editor.

---

## Step 3 — Set the Anchor version

In the left sidebar click the ⚙️ **Settings** icon → **Anchor version** → select **0.30.1**.

---

## Step 4 — Build

Click the 🔨 **Build** button (or `Ctrl+Shift+B`).

Wait for: `Build successful` in the console.

---

## Step 5 — Connect wallet & switch to Devnet

1. Click **"Connect"** in the top-right of Playground.
2. Select **Phantom** (or your wallet).
3. Ensure the network selector shows **Devnet**.

---

## Step 6 — Deploy

Click the 🚀 **Deploy** button.

Approve the wallet transaction (~0.5 SOL rent).

Wait for: `Deployment successful` — Playground will display the **Program ID**.

---

## Step 7 — Copy the Program ID

It looks like: `AbcD1234...XyZ` (base58, 44 chars).

**Copy it** — you will paste it into the repo next.

---

## Step 8 — Patch the Program ID into the codebase

In `programs/bov/src/lib.rs`, replace:

```rust
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
```

with:

```rust
declare_id!("<YOUR_PROGRAM_ID>");
```

In `app/src/lib/bov-client.ts`, replace:

```ts
export const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
```

with:

```ts
export const PROGRAM_ID = new PublicKey("<YOUR_PROGRAM_ID>");
```

In `idl/bov.json`, replace the `"address"` field at the top:

```json
"address": "<YOUR_PROGRAM_ID>",
```

---

## Step 9 — Initialize the Vault (one-time)

After patching, open `app/src/lib/bov-client.ts` and confirm `VAULT_AUTHORITY` matches your deployer wallet pubkey.

Then from the deposit page (connect wallet → try depositing) the `initialize_vault` account check will auto-create the vault PDA on first use, **or** run this from Playground's **Test** tab:

```
instruction: initialize_vault
vault_id: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
chains: 4
target_bps: [6000, 2500, 1000, 500]
```

---

## Step 10 — Commit & push

```bash
git add programs/bov/src/lib.rs app/src/lib/bov-client.ts idl/bov.json
git commit -m "patch: real program ID after devnet deploy"
git push origin main
```

Vercel will auto-redeploy the frontend with the live program ID.

---

## Verify on Solscan

```
https://solscan.io/account/<YOUR_PROGRAM_ID>?cluster=devnet
```

You should see the program account with `Executable: true`.

---

## Checklist

- [ ] Program deployed on devnet
- [ ] Program ID patched in `lib.rs`, `bov-client.ts`, `idl/bov.json`
- [ ] Vault initialized
- [ ] Test deposit → real TX signature appears on Solscan
- [ ] Dashboard shows live position after deposit
- [ ] Commit pushed → Vercel redeploys
