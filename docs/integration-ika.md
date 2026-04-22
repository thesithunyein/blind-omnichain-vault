# Ika integration

We use Ika exclusively through its Solana pre-alpha dWallet surface.

## On-chain (Rust)

- `programs/bov/src/ika.rs` — CPI wrappers for:
  - `cpi_notify_policy_binding` — binds a dWallet's policy share to the vault PDA.
  - `cpi_approve_dwallet_sign_if` — conditionally authorizes a 2PC-MPC sign, guarded by an encrypted boolean.

## Off-chain (TypeScript)

- `sdk/src/ika.ts` — `IkaProvider` interface:
  - `createDWallet(chain, policyPda)`
  - `prepareTransferTx(from, to, amount)`
  - `signUserShare(digest)`
  - `broadcast(chain, rawTxWithSig)`

## Devnet wiring

To replace the mock provider:

```ts
import { attachIkaProvider } from "@bov/sdk";
import { makeIkaDevnetProvider } from "@ika-xyz/solana-sdk"; // when available

attachIkaProvider(makeIkaDevnetProvider({ rpc: "https://api.devnet.solana.com" }));
```

## Supported chains

`DWalletChain.Bitcoin`, `Ethereum`, `Sui`, `Solana`, `Zcash`, `Cosmos`. More added as Ika support expands.
