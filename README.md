# 🏆 BlindVault: Zero-Information Omnichain Trading

> **Bridgeless liquidity meets absolute zero-knowledge privacy.** **BlindVault** is a privacy-preserving, cross-chain trading vault built for the Ranger "Build-A-Bear" Hackathon. It utilizes **Fully Homomorphic Encryption (FHE)** on Solana to evaluate trading strategies without decrypting them, and **Multi-Party Computation (MPC)** via the Ika Network to execute those trades bridgelessly on Ethereum.

### 🎥 Project Demo
* **Pitch Video:** [Insert Link to your YouTube/Loom video here]

---

## ⚠️ The Problem: Public Strategies = Lost Capital
DeFi limit orders and vault strategies are entirely public. When you set a target price on-chain, your strategy is exposed to the world. This leaves traders incredibly vulnerable to MEV bots, front-running, and copy-trading, resulting in worse execution prices and lost capital.

## 💡 The Solution: Zero Information Leakage
BlindVault fixes the front-running problem by combining two cutting-edge cryptographic primitives:

1. **FHE Privacy (Encrypt Network):** Users encrypt their target buy/sell prices locally in the browser. The Solana smart contract continuously compares live oracle prices against this ciphertext *without ever decrypting the user's strategy*. Nobody—not even the validators—knows the target price.

2. **Bridgeless Execution (Ika Network):** When the FHE condition evaluates to `True`, the contract does not use a wrapped token bridge. Instead, it triggers the Ika MPC network to command a dedicated Ethereum dWallet to execute the trade directly on Uniswap. Native assets, zero bridges.

---

## 🗺️ Architecture Flow

User Input (Next.js)  
➡️ Local FHE Encryption  
➡️ Ciphertext Stored on Solana PDA  
➡️ Oracle Price compared via FHE (Encrypt SDK)  
➡️ Condition Met (`True`)  
➡️ CPI to Ika Network  
➡️ Ika dWallet signs Ethereum Tx  
➡️ Native Swap Executed (Uniswap V3)

---

## 🏗️ Tech Stack
* **Frontend:** Next.js, Tailwind CSS, Solana Wallet Adapter
* **Smart Contracts:** Rust, Anchor Framework
* **Privacy Layer:** Encrypt Pre-Alpha FHE SDK
* **Cross-Chain Layer:** Ika MPC SDK (dWallets)

---

## 🎯 Why This Matters (Hackathon Impact)
* **True Hybrid Integration:** BlindVault represents the "Holy Grail" use case for this hackathon track, seamlessly combining **Encrypt** (for encrypted capital markets) and **Ika** (for bridgeless capital markets) into a single, cohesive product.

* **Commercial Viability:** Solves a multi-million dollar MEV problem for institutional and retail traders alike. 

* **Seamless UX:** Users interact exclusively with Solana, paying cheap fees, while settling natively on Ethereum.

---

## 💻 Run Locally

### 1. Frontend (Next.js)
cd frontend
npm install
npm run dev

### 2. Smart Contracts (Rust / Anchor)
# Build the FHE Vault program
cargo build --manifest-path encrypt-pre-alpha/chains/solana/examples/voting/anchor/Cargo.toml

---

Built with ❤️ for the Ranger Hackathon. Solana + Encrypt + Ika.