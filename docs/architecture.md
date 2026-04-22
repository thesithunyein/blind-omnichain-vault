# Architecture

> Live demo: **[blind-omnichain-vault.vercel.app](https://blind-omnichain-vault.vercel.app)**  
> Devnet transactions: [Solscan devnet](https://solscan.io/?cluster=devnet)

## Layers

1. **Native chains** — Bitcoin, Ethereum, Sui, etc. Hold the real assets. Addresses are dWallet public keys.
2. **Ika Network** — 2PC-MPC signers. Co-signs chain txs only when Solana policy approves.
3. **Encrypt Network** — Executors (FHE compute) + Decryptors (threshold decrypt).
4. **Solana program `bov`** — source of truth for vault state, policy, dWallet registry. All balance-like fields stored as Encrypt ciphertexts.
5. **SDK `@bov/sdk`** — client-side encryption, Ika dWallet orchestration, Anchor bindings.
6. **App** — Next.js 14 frontend for end users & operators.

## Data flow: deposit

```
user              Ika              BOV program         Encrypt          native chain
  |                |                    |                 |                  |
  |-- createDWallet->                   |                 |                  |
  |<--foreign address------             |                 |                  |
  |                |   register_dwallet |                 |                  |
  |                |<-------------------|                 |                  |
  |-- native send (e.g. BTC) ------------------------------------------------>|
  |                |                    |                 |                  |
  |-- encrypt(amount) -------------------->                                   |
  |                |   deposit(enc)     |                 |                  |
  |                |<-------------------|--- fhe_add ---->|                  |
  |                |                    |<-- enc_sum -----|                  |
```

## Data flow: private rebalance

```
cranker          BOV program        Encrypt          Ika             dest chain
  |                |                   |               |                 |
  |-- request_rebalance ->             |               |                 |
  |                |--- fhe_gt/and --->|               |                 |
  |                |<-- enc_bool ------|               |                 |
  |                |--- approve_sign_if(enc_bool) ---->|                 |
  |                |                   |  (threshold-decrypt enc_bool)   |
  |                |                   |               |-- 2PC-MPC co-sign                      |
  |                |                   |               |--- broadcast -->|
```

The program never learns whether the rebalance triggered. Only the Ika threshold-decrypts the guard internally; Solana sees only "approved" or nothing.

## Why the program never holds plaintext

- Authority compromise → still nothing leaks.
- Storage scraping → ciphertexts only.
- MEV search → no inputs to copy.

## Threat model

| Threat                           | Mitigation                                   |
|----------------------------------|----------------------------------------------|
| Bridge hack                      | No bridge. Native custody via Ika.          |
| MEV front-running                | Strategy is ciphertext end-to-end.          |
| Compromised vault authority      | Cannot decrypt; threshold committee needed. |
| Colluding Ika nodes (< threshold)| 2PC-MPC prevents partial reconstruction.    |
| Colluding Decryptors (< threshold)| Threshold-FHE prevents partial reconstruction.|
| Encrypt circuit bug              | Public audits of REFHE; fallback pause.     |
