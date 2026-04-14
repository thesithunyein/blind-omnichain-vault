# 🏆 BlindVault

### Zero-Information Omnichain Trading

> Bridgeless liquidity meets absolute zero-knowledge privacy

![Status](https://img.shields.io/badge/status-hackathon-blue)
![Solana](https://img.shields.io/badge/built%20on-Solana-purple)
![Ethereum](https://img.shields.io/badge/settlement-Ethereum-black)
![Privacy](https://img.shields.io/badge/privacy-Encrypt_REFHE-green)
![Execution](https://img.shields.io/badge/execution-Ika_MPC-orange)

---

## 🚀 Overview

BlindVault is a privacy-preserving, cross-chain trading vault built for the Solana Frontier Hackathon. 

By functioning as a true hybrid infrastructure project, it pioneers both **Encrypted Capital Markets** and **Bridgeless Capital Markets** in a single protocol.

It enables users to:
* Hide their trading strategies completely from the public ledger
* Execute trades natively across chains without vulnerable bridges
* Avoid MEV, front-running, and copy trading

This is achieved using:
* **Fully Homomorphic Encryption (REFHE Protocol)** via Encrypt on Solana
* **Multi-Party Computation (2PC-MPC Protocol)** via Ika Network on Ethereum

---

## 🎥 Demo

* 🎥 **Demo & Pitch Video:** [Watch on Youtube](https://youtu.be/0cDasaE2718)

---

## ⚠️ The Problem & Target Users

In DeFi, everything is public. When a user places a limit order or defines a vault strategy, target prices are visible on-chain. Bots monitor and exploit these strategies, causing users to get front-run or copied. 

**Target Users:** * **Institutional Traders & Whales:** Who need to move large sizes without signaling the market.
* **Retail Traders:** Who want to execute automated strategies without losing profit to MEV bots.

**The Result of Public Markets:**
* Worse execution
* Lost profits
* Single-point-of-failure bridge hacks

---

## 💡 The Solution

BlindVault ensures **zero information leakage** by using Solana as a highly-performant, zero-knowledge control layer.

### 🔐 Private Strategy Execution (Encrypt REFHE)
* Users encrypt trading conditions locally in the browser.
* Data is stored strictly as ciphertext on Solana.
* Smart contracts evaluate live oracle conditions against the ciphertext without decryption.
* The strategy remains 100% invisible to the public and validators.

### 🌉 Bridgeless Cross-Chain Execution (Ika 2PC-MPC)
* When FHE conditions are met, execution is triggered via CPI.
* We move the *intent*, not the assets—zero bridges or wrapped tokens.
* The Ika MPC network controls a programmable Ethereum dWallet.
* The trade executes natively on Uniswap V3.

---

## 🧠 Architecture

```mermaid
flowchart LR
    A[User - Next.js] --> B[Local FHE Encryption]
    B --> C[Ciphertext on Solana PDA]
    C --> D[FHE Oracle Price Check]
    D -->|Condition True| E[CPI to Ika Network]
    E --> F[Ika MPC dWallet]
    F --> G[Execute Native Trade on Uniswap V3]
```

---

## 🔄 Flow Summary & Use Case

Example Use Case: A trader wants to buy WBTC on Ethereum at $65,000 without revealing their target price to the market.

User inputs trade conditions in the Next.js UI.

Conditions are encrypted locally (Zero-knowledge proof generated).

Encrypted data is deposited into the Solana vault.

Solana program checks oracle prices via FHE.

If the condition is true, a CPI calls the Ika Network.

Ika MPC signs a transaction for the user's dedicated dWallet.

Trade executes and settles using native assets on Ethereum.

---

## 🏗️ Tech Stack

Layer	Technology
Frontend	Next.js, Tailwind CSS
Wallet	Solana Wallet Adapter
Smart Contracts	Rust, Anchor
Privacy	Encrypt FHE SDK
Cross-Chain	Ika MPC (dWallets)
Execution	Uniswap V3

---

## 💻 How to Build, Test, and Use

1. Clone Repo

Bash

git clone https://github.com/thesithunyein/blind-omnichain-vault.git
cd blind-omnichain-vault

2. Run Frontend UI

Bash

cd frontend
npm install
npm run dev

Open http://localhost:3000 to interact with the strategy builder.

3. Build Smart Contracts (Devnet)

Bash

# Build the FHE program utilizing Encrypt's Devnet SDK
cargo build --manifest-path encrypt-pre-alpha/chains/solana/examples/voting/anchor/Cargo.toml

---

## 🔗 Deployed Program IDs

Environment: Solana Devnet / Localnet

Encrypt Program: (Available via Encrypt pre-alpha devnet cluster)

Ika dWallet: (Generated dynamically per user session via 2PC-MPC)

---

## 📦 Project Structure

Bash

blind-omnichain-vault/
├── frontend/           # Next.js UI and FHE Client logic
├── ika/                # MPC integration and dWallet setup
├── encrypt-pre-alpha/  # FHE implementation & Solana programs
├── LICENSE
└── README.md

---

## 🏆 Hackathon Alignment (Why this fits the Frontier Track)

Core Integration: Fundamentally relies on both Encrypt and Ika. Neither is superficial; without Encrypt, strategies are public. Without Ika, we are forced to use vulnerable bridges.

Commercial Potential: Directly solves the multi-million dollar MEV extraction problem.

Innovation: Shifts Solana from just a fast chain to the ultimate "blind control layer" for all of Web3.

---

## 🔮 Future Work

Add more DEX integrations across EVM chains (Curve, PancakeSwap).

Support multiple combined conditions per vault (e.g., TWAP + Price Floors).

Launch mainnet deployment alongside Encrypt and Ika production releases.

---

## 🤝 Team

Built as a solo developer to pioneer Bridgeless Capital Markets and Encrypted Capital Markets on Solana.

---

## ❤️ Acknowledgements

Solana Foundation

Encrypt Network

Ika Network

---

## 📜 License

MIT License