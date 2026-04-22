# Encrypt integration

> Live demo: **[blind-omnichain-vault.vercel.app](https://blind-omnichain-vault.vercel.app)**  
> Program: `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS` on [Solscan devnet](https://solscan.io/account/Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS?cluster=devnet)

All balance-like and policy-like state on-chain is stored as `EncU64` ciphertexts. The Solana program never holds plaintext.

## On-chain (Rust)

- `programs/bov/src/encrypt.rs` — `EncU64`, `EncBool`, and CPI wrappers:
  - `fhe_add`, `fhe_sub`, `fhe_gt`, `fhe_and`
  - `cpi_threshold_decrypt`
- `programs/bov/src/policy.rs` — the rebalance policy is a pure composition of these ops.

## Off-chain (TypeScript)

- `sdk/src/encrypt.ts` — `EncryptProvider` interface:
  - `encryptU64(value)`, `decryptU64(ct)`
  - `fheAdd(a, b)`, `fheGt(a, b)`

A deterministic in-memory provider ships by default so the demo and tests run without external services.

## Devnet wiring

```ts
import { attachEncryptProvider } from "@bov/sdk";
import { makeEncryptDevnetProvider } from "@encrypt-xyz/sdk"; // when available

attachEncryptProvider(makeEncryptDevnetProvider({
  cluster: "pre-alpha-devnet",
}));
```

## What never leaves the user's device in plaintext

- Per-user deposit amount
- Per-user share balance
- Vault target weights
- Rebalance band
- Rebalance trigger boolean
- Vault NAV
- Per-chain balances

## What *does* get decrypted (and when)

- **Only the caller's share** — at `withdraw()`, via threshold decryption, delivered to the caller.
- **Rebalance trigger ciphertext** — threshold-decrypted *inside* the Ika co-sign round so it's consumed, not published. The Solana program only sees "approved" / "not approved".
