# BOV Frontend (Next.js 14)

Placeholder — the UI is built in the next milestone.

Planned stack:

- Next.js 14 App Router
- TailwindCSS + shadcn/ui
- Solana Wallet Adapter
- `@bov/sdk` for all onchain + Ika + Encrypt interactions

Planned screens:

- Landing (pitch, live vault stats — all ciphertext badges)
- Vault dashboard (your encrypted position, P&L, chain breakdown — decrypted only for you)
- Deposit flow (pick chain → get dWallet address → QR)
- Rebalance log (shows encrypted trigger events, not amounts)

Run:

```bash
pnpm --filter app dev
```
