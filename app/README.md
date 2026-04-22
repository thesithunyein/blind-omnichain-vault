# BOV Frontend (Next.js 14)

Live demo → **[blind-omnichain-vault.vercel.app](https://blind-omnichain-vault.vercel.app)**

A macOS-native glass morphism UI for the Blind Omnichain Vault — a Solana program that
manages multi-chain native assets through **Ika dWallets** while keeping every balance,
strategy parameter, and rebalance signal encrypted via **Encrypt FHE**.

## Stack

- **Next.js 14** App Router (React 18, TypeScript)
- **Tailwind CSS** — macOS glass morphism design tokens, Inter font, shimmer animations
- **Solana Wallet Adapter** — Phantom / Backpack / any Solana wallet
- **`@bov/sdk`** — onchain Anchor bindings, Ika dWallet orchestration, Encrypt FHE helpers

## Screens

| Route | Description |
|-------|-------------|
| `/` | Hero landing — live encrypted NAV badge, feature cards, how-it-works, tech stack |
| `/dashboard` | Vault stats, chain allocation bars, your encrypted position, rebalance log with Solscan devnet links |
| `/deposit` | Pick chain → get Ika dWallet address → QR code |
| `/docs` | SDK usage and integration guides |

## Run locally

```bash
pnpm --filter app dev
# → http://localhost:3000
```

## Design highlights

- All user balances, P&L, and strategy weights display as **EncryptedBadge** — animated
  ciphertext placeholders. Nothing sensitive is ever shown in plaintext.
- Every on-chain transaction in the rebalance log links directly to
  **[Solscan devnet](https://solscan.io/?cluster=devnet)** for full transparency.
- Fully responsive — hamburger nav on mobile, glass cards on desktop.
