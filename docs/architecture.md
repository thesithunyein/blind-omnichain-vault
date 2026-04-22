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

## Data flow: withdraw

```
user              BOV program          Encrypt Decryptors      native chain
  |                    |                       |                     |
  |-- withdraw(chain)->|                       |                     |
  |                    |-- cpi_threshold_decrypt(encrypted_shares) ->|
  |                    |   (zeroes enc_shares on-chain)              |
  |                    |                       |-- threshold-decrypt |
  |                    |                       |<- plaintext_amount -|
  |                    |                       |-- request Ika sign ->
  |                    |                       |         |-- 2PC-MPC ->
  |<----- native asset payout on dest chain ---------------------
```

Only the withdrawing user's ciphertext is ever decrypted. All other users' balances
remain encrypted and inaccessible throughout the process.

## Why the program never holds plaintext

- Authority compromise → still nothing leaks (threshold committee still required).
- Storage scraping → ciphertexts only; no oracle for plaintext.
- MEV search → encrypted inputs produce no exploitable signal.
- Validator collusion → cannot read FHE ciphertext without committee quorum.

## Threat model

| Threat | Mitigation | Residual risk |
|--------|-----------|---------------|
| Bridge hack | No bridge — Ika native custody | None |
| MEV front-running | Strategy + amounts in ciphertext | None |
| Compromised vault authority | Cannot decrypt without Encrypt committee | Auth key rotation needed |
| Colluding Ika nodes (< threshold) | 2PC-MPC: partial shares useless | Node diversity required |
| Colluding Encrypt Decryptors (< threshold) | REFHE: partial decrypts useless | Decryptor diversity required |
| Ika node collusion (≥ threshold) | Catastrophic — mitigated by node diversity | Ika's responsibility |
| Encrypt circuit bug | Public REFHE audits; emergency `set_paused` CPI | Fallback pause |
| Solana validator eclipse | Standard Solana security model | Solana's responsibility |
| Front-running deposit timing | Deposit amount is encrypted before tx lands | None |

## Glossary

| Term | Meaning |
|------|---------|
| **EncU64** | Encrypt FHE ciphertext of a u64 — a balance, weight, or NAV figure |
| **EncBool** | Encrypt FHE ciphertext of a boolean — a rebalance trigger or guard |
| **dWallet** | Ika 2PC-MPC signing object — one share on-chain (policy), one off-chain (user) |
| **2PC-MPC** | Two-party computation / multi-party computation — co-signing protocol |
| **REFHE** | Reusable FHE — the Encrypt protocol for on-chain homomorphic computation |
| **cranker** | Off-chain bot that calls `request_rebalance` to trigger strategy evaluation |
| **guard_ct** | `EncBool` passed to Ika; Ika threshold-decrypts it to decide whether to sign |
