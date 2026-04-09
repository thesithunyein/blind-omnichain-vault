# 🛡️ BlindVault: Zero-Information Omnichain Trading

**BlindVault** is a privacy-preserving, cross-chain trading vault built for the Ranger "Build-A-Bear" Hackathon. It utilizes Fully Homomorphic Encryption (FHE) on Solana to evaluate trading strategies without decrypting them, and Multi-Party Computation (MPC) via the Ika Network to execute those trades bridgelessly on Ethereum.

## 🎥 Project Demo
* **Pitch Video:** [Insert Link to your YouTube/Loom video here]

## ⚠️ The Problem
DeFi limit orders and vault strategies are entirely public. When you set a target price on-chain, your strategy is exposed to the world, leaving you vulnerable to MEV bots, front-running, and copy-trading. 

## 💡 The Solution
BlindVault fixes this by ensuring **Zero Information Leakage**:
1. **FHE Privacy (Encrypt Network):** Users encrypt their target buy/sell prices locally in the browser. The Solana smart contract continuously compares live oracle prices against this ciphertext *without ever decrypting the user's strategy*.
2. **Bridgeless Execution (Ika Network):** When the FHE condition is met, the contract does not use a wrapped token bridge. Instead, it triggers the Ika MPC network to command a dedicated Ethereum dWallet to execute the trade directly on Uniswap.

## 🏗️ Architecture & Tech Stack
* **Frontend:** Next.js, Tailwind CSS, Solana Wallet Adapter
* **Smart Contracts:** Rust, Anchor Framework
* **Privacy Layer:** Encrypt pre-alpha FHE SDK
* **Cross-Chain Layer:** Ika MPC SDK (dWallets)

## 🚀 How It Works
1. **Connect & Encrypt:** User connects a Solana wallet (Phantom/Backpack) and inputs a target price for an Ethereum asset (e.g., WBTC). The UI encrypts this value locally.
2. **Deposit:** The ciphertext is stored in a secure Solana PDA (Program Derived Address).
3. **Evaluate:** The Encrypt FHE engine performs greater-than/less-than math on the encrypted price against live market data. 
4. **Execute:** Upon a `True` evaluation, a Cross-Program Invocation (CPI) signals the Ika Network to sign an Ethereum transaction, executing the swap via a dWallet.

## 💻 Run Locally

### 1. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev

## 2. Smart Contracts (Rust / Anchor)

### Build the FHE Vault Program

```bash
cargo build --manifest-path encrypt-pre-alpha/chains/solana/examples/voting/anchor/Cargo.toml