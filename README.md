# Blind Omnichain Vault (BOV)

> **Bridgeless + Blind.** The first Solana vault that custodies *native* BTC / ETH / other-chain assets without bridges (via **Ika dWallets**) and runs its strategy on *encrypted* state (via **Encrypt FHE**) — so nobody, not even MEV bots or other LPs, can see what it holds or how it trades.

Submission for the **Colosseum Frontier — Encrypt & Ika** bounty.

**🔗 Live Demo: [blind-omnichain-vault.vercel.app](https://blind-omnichain-vault.vercel.app)**

---

## 1. The Problem

Institutional DeFi on Solana is stuck on two problems at once:

1. **Liquidity is fragmented across chains.** Bringing BTC or ETH onto Solana today means wrapping it, trusting a bridge, or trusting a custodian. Every bridge hack this cycle proves the model is broken.
2. **Public execution leaks strategy.** Every vault on Solana today publishes its full position book, its rebalance trigger, and its counterparties. MEV searchers front-run. Competitors copy-trade. Real asset managers will not deploy capital under those conditions.

No single project today fixes **both**. Projects that solve custody (LayerZero, Wormhole, Squads) leave strategies public. Projects that solve privacy (Elusiv, Arcium-style) are single-chain and single-asset.

## 2. The Solution — Blind Omnichain Vault

A Solana program that lets anyone launch a vault which:

- **Holds native assets on their home chains** — real BTC on Bitcoin, real ETH on Ethereum — custodied through **Ika dWallets** controlled by the Solana program. No bridges, no wrapping, no centralized custodian.
- **Keeps all state encrypted** — deposits, per-user balances, strategy parameters, and rebalance thresholds live as **Encrypt FHE ciphertexts** on Solana. The program computes P&L, NAV, and rebalance signals directly on the encrypted data.
- **Enforces strategy in Solana** — the vault's rebalance policy is a Solana program. Ika will only co-sign a cross-chain transaction if Solana approves it against the encrypted state. Zero-trust, onchain, auditable.

### Target users

| User | Pain today | What BOV gives them |
|---|---|---|
| Institutional asset manager | Can't deploy on Solana without leaking positions | Confidential multi-chain book on Solana |
| BTC/ETH holder | Bridging is unsafe | Native custody, yield via Solana programs |
| DAO treasury | Multi-chain treasuries are operational nightmare | One Solana program controls assets everywhere |
| AI trading agent | No decentralized guardrails | Encrypted policy bounds enforced by Solana |

## 3. How Ika and Encrypt Are Used (Core, Not Superficial)

BOV is **useless without both**. Remove either and the product breaks.

### Ika (custody + interoperability)

- When a user deposits, the program creates (or reuses) a **dWallet** per chain. The dWallet's public key is an address on Bitcoin / Ethereum / etc. The user sends native assets there.
- The **Solana program holds the policy half** of the 2PC-MPC signature. A rebalance from BTC → ETH only executes if the Solana program issues an `ApproveDWalletSign` instruction after checking the encrypted rebalance policy.
- No bridge. No wrapping. The asset is *still* on Bitcoin, but Solana has programmatic, policy-bound signing authority over it.

See `programs/bov/src/ika.rs` for the dWallet integration layer.

### Encrypt (confidentiality)

- Every per-user deposit is stored as an **Encrypt FHE ciphertext** (`EncU64`) in the vault's PDA.
- The NAV, total-value-locked, and per-asset weights are **FHE-summed** on-chain without ever being decrypted.
- The rebalance trigger is `fhe_gt(encrypted_btc_weight, encrypted_target_weight + encrypted_band)` — evaluated entirely on ciphertexts via the REFHE protocol. The Solana program only sees a ciphertext of a boolean.
- Threshold decryption is only invoked at user withdrawal (for that user's share) or at vault-close. At no other time is any balance, weight, or signal visible to anyone, including the vault operator.

See `programs/bov/src/encrypt.rs` and `sdk/src/encrypt.ts`.

### Why the combination is novel

| Capability | Ika alone | Encrypt alone | **BOV = Ika + Encrypt** |
|---|---|---|---|
| Native cross-chain custody | ✅ | ❌ | ✅ |
| Private strategy | ❌ | ✅ | ✅ |
| Private *cross-chain* strategy | ❌ | ❌ | ✅ **(first)** |
| MEV resistance for cross-chain rebalances | ❌ | ❌ | ✅ **(first)** |

## 4. Architecture

```
┌─────────────────────── User (web / CLI / agent) ───────────────────────┐
│                                                                        │
│   deposit(native BTC)   withdraw(SOL)   view encrypted P&L             │
└────────────────────────────┬───────────────────────────────────────────┘
                             │  (SDK: @bov/sdk)
                             ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    Solana Program: programs/bov                       │
│                                                                       │
│   Vault PDA ─────── Encrypted ledger (EncU64[])                      │
│        │                                                              │
│        ├──▶ policy engine ──▶ fhe_rebalance_signal() ─▶ Encrypt      │
│        │                                                              │
│        └──▶ dwallet registry ─▶ approve_sign(btc_tx) ─▶ Ika          │
└────────────┬──────────────────────────────────┬───────────────────────┘
             │                                  │
             ▼                                  ▼
   ┌──────────────────┐               ┌──────────────────┐
   │   Ika Network    │               │ Encrypt Network  │
   │  (2PC-MPC nodes) │               │ (Executors +     │
   │  co-signs tx for │               │  Decryptors,     │
   │  BTC, ETH, ...   │               │  REFHE + TFHE)   │
   └────────┬─────────┘               └──────────────────┘
            │
            ▼
     Bitcoin / Ethereum / Sui / ... (native assets move here)
```

## 5. Repo Layout

```
blind-omnichain-vault/
├── programs/bov/        # Solana program (Anchor, Rust)
│   └── src/
│       ├── lib.rs           # entry, instructions
│       ├── state.rs         # Vault, EncryptedLedger, DWalletRegistry
│       ├── encrypt.rs       # Encrypt FHE integration (CPI stubs + types)
│       ├── ika.rs           # Ika dWallet integration (CPI stubs + types)
│       ├── policy.rs        # FHE-evaluated rebalance policy
│       └── errors.rs
├── sdk/                 # TypeScript SDK used by frontend & tests
│   └── src/
│       ├── index.ts
│       ├── client.ts        # BovClient: deposit, withdraw, rebalance
│       ├── encrypt.ts       # Encrypt FHE wrapper (encrypt/decrypt/ops)
│       ├── ika.ts           # Ika dWallet wrapper (create, sign, broadcast)
│       └── types.ts
├── app/                 # Next.js 14 + Tailwind + shadcn/ui frontend
├── tests/               # Anchor + mocha integration tests
├── scripts/             # devnet deploy, demo, airdrop
├── docs/                # architecture.md, integration-ika.md, integration-encrypt.md
└── README.md
```

## 6. Build, Test, Run

### Prerequisites

- Node.js ≥ 20
- Rust ≥ 1.75
- Solana CLI ≥ 1.18 (`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`)
- Anchor ≥ 0.30 (`cargo install --git https://github.com/coral-xyz/anchor anchor-cli`)

### Install

```bash
# Root
pnpm install              # installs sdk + app workspaces

# Program
cd programs/bov && anchor build
```

### Test

```bash
anchor test               # runs Solana program tests against local validator
pnpm --filter sdk test    # SDK unit tests
```

### Deploy to devnet

```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 5
anchor deploy --provider.cluster devnet
pnpm --filter app dev     # open http://localhost:3000
```

### Demo script

```bash
pnpm ts-node scripts/demo.ts
# 1) creates a vault
# 2) creates an Ika dWallet for Bitcoin
# 3) encrypts a deposit amount via Encrypt
# 4) deposits; verifies ledger stays ciphertext
# 5) triggers rebalance; Solana approves Ika signature
# 6) withdraws; threshold-decrypts only the user's share
```

## 7. Deployed Artifacts

| Artifact | Network | Address |
|---|---|---|
| BOV Program | Solana Devnet | `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS` *(placeholder — set after `anchor deploy`)* |
| Demo Vault | Solana Devnet | *(set by `scripts/demo.ts`)* |
| Frontend | Vercel | *(added post-deploy)* |

## 8. Demo Video

*(under 5 min — link added to repo after recording)*

The video covers:

1. The problem (30s)
2. Architecture walkthrough (60s)
3. Live devnet demo: deposit native BTC → encrypted rebalance → withdraw (2min)
4. Why Ika + Encrypt is essential, not cosmetic (60s)
5. Roadmap to mainnet (30s)

## 9. Roadmap

- **Phase 1 (this submission):** Devnet program + SDK + UI, BTC + ETH support, single-strategy (target-weight rebalance).
- **Phase 2:** Multiple strategies (basis trade, covered-call, delta-neutral), strategy marketplace.
- **Phase 3:** Permissioned institutional vaults with passkey + recovery (Ika WaaP integration).
- **Phase 4:** AI agent vaults — encrypted policy bounds, agent trades within them.

## 10. License

MIT. See `LICENSE`.

## 11. Acknowledgements

- **Ika** — dWallet primitives and 2PC-MPC cryptography
- **Encrypt** — REFHE + Threshold FHE infrastructure
- **Colosseum Frontier** — for running this hackathon
- **Solana Foundation** — for the fastest settlement layer on earth

---

**Contact:** [@thesithunyein](https://github.com/thesithunyein)
