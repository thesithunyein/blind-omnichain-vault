# 🏆 BlindVault

### Zero-Information Omnichain Trading
> **Bridgeless liquidity meets absolute zero-knowledge privacy.**

![Status](https://img.shields.io/badge/status-hackathon-blue)
![Solana](https://img.shields.io/badge/built%20on-Solana-purple)
![Ethereum](https://img.shields.io/badge/settlement-Ethereum-black)
![Privacy](https://img.shields.io/badge/privacy-Encrypt_REFHE-green)
![Execution](https://img.shields.io/badge/execution-Ika_MPC-orange)

---

## 🚀 Overview

**BlindVault** is a privacy-preserving, cross-chain trading protocol built for the **Solana Frontier Hackathon**. 

By functioning as a true hybrid infrastructure project, it pioneers both **Encrypted Capital Markets** and **Bridgeless Capital Markets** in a single protocol. It allows users to execute complex trading strategies across chains without leaking their intent to the public mempool or relying on risky bridges.

### Key Features
* **Zero-Knowledge Strategies:** Hide target prices and logic from MEV bots using FHE.
* **Bridgeless Settlement:** Move intents, not assets. Execute natively on Ethereum via Solana logic.
* **MEV Protection:** Eliminate front-running and copy-trading through "Blind" execution.

---

## 🎥 Demo

* 🎥 **Demo & Pitch Video:** [Watch on Youtube](https://youtu.be/0cDasaE2718)

---

## 💡 The Solution: A Hybrid Architecture

BlindVault uses Solana as a **Private Control Layer** to manage cross-chain capital.

### 🔐 Private Strategy Execution (Encrypt REFHE)
Users encrypt their trading conditions (e.g., "Buy WBTC if price < $65k") locally in the browser. This ciphertext is stored on Solana. The smart contract evaluates live prices against the ciphertext using **Fully Homomorphic Encryption**, meaning the strategy is never decrypted on-chain.

### 🌉 Bridgeless Execution (Ika 2PC-MPC)
Once the FHE condition evaluates to `True`, the Solana program triggers the **Ika Network**. Using Multi-Party Computation, Ika signs a transaction for a dedicated dWallet on Ethereum, executing the trade natively on **Uniswap V3**.

---

## 🔒 Security & Trust Model

* **Privacy:** Zero-knowledge is maintained via FHE; no plaintext strategy data ever touches the Solana ledger.

* **Execution:** Ika Network's 2PC-MPC ensures that the user's dWallet is only triggered when the FHE condition evaluates to True, eliminating centralized relayer risk.

---

## 🧠 Technical Architecture

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

## 🏗️ Tech Stack

| Layer          | Technology                     |
|--------------|-------------------------------|
| **Frontend** | Next.js 14, Tailwind CSS, ethers.js |
| **Contracts** | Rust, Anchor Framework         |
| **Privacy** | Encrypt REFHE SDK (Pre-Alpha) |
| **Cross-Chain**| Ika 2PC-MPC (dWallets)         |
| **Settlement** | Ethereum (Uniswap V3)         |

---

## 💻 How to Build & Run

### 1. Prerequisites
* Rust / Anchor CLI
* Node.js & npm
* Solana CLI
* **⚠️ Note for Windows Users:** Solana's `build-sbf` toolchain is not natively supported in standard PowerShell/CMD. You **must** use WSL (Windows Subsystem for Linux) or a Linux/macOS environment (like GitHub Codespaces) to build the smart contracts.

### 2. Clone & Install
```bash
git clone https://github.com/thesithunyein/blind-omnichain-vault.git
cd blind-omnichain-vault
```

### 3. Smart Contract Build
```bash
# Navigate to the Anchor program
cd encrypt-pre-alpha/chains/solana/examples/voting/anchor

# Build for SBF
cargo build-sbf
```

### 4. Frontend Launch
```bash
# Return to root and enter frontend directory
cd ../../../../../../frontend

# Install and Run
npm install
npm run dev
```
*Access the dashboard at `http://localhost:3000`*

---

## 🔗 Deployment Info

* **Network:** Solana Devnet
* **Program ID:** `VotingAnchor1111111111111111111111111111111`
* **FHE Logic:** Implemented in `lib.rs` using `#[encrypt_fn]` to handle encrypted price comparisons.

---

## 🏆 Hackathon Alignment (Frontier Track)

* **Core Integration:** Fundamentally built on both Encrypt and Ika SDKs.
* **Innovation:** First-of-its-kind fusion of "Blind" triggers on Solana with "Native" execution on Ethereum.
* **Commercial Potential:** Direct solution for institutional MEV protection and bridge-risk mitigation.

---

## 🔮 Future Roadmap
* **Multi-DEX Support:** Expansion to Curve and PancakeSwap.
* **Complex Triggers:** Support for TWAP and multi-condition encrypted vaults.
* **Mainnet Migration:** Deployment following the production release of Encrypt and Ika.

---

## 🤝 Team
Built with ❤️ by a solo developer for the **Solana Frontier Hackathon**. 

---

## 📜 License
This project is licensed under the MIT License.