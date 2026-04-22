export const SOLSCAN_BASE = "https://solscan.io/tx";
export const SOLSCAN_CLUSTER = "?cluster=devnet";
export const BOV_PROGRAM_ID = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS";
export const SOLSCAN_PROGRAM_URL = `https://solscan.io/account/${BOV_PROGRAM_ID}${SOLSCAN_CLUSTER}`;

export const MOCK_VAULT = {
  id: "1",
  totalNavUsd: null,       // always null — encrypted
  totalDepositors: 142,
  dwalletCount: 4,
  paused: false,
  chains: [
    { name: "Bitcoin",  symbol: "BTC", chain: 0, targetBps: 6000, color: "#f7931a" },
    { name: "Ethereum", symbol: "ETH", chain: 1, targetBps: 2500, color: "#627eea" },
    { name: "Sui",      symbol: "SUI", chain: 2, targetBps: 1000, color: "#4da2ff" },
    { name: "Zcash",    symbol: "ZEC", chain: 4, targetBps: 500,  color: "#f4b728" },
  ],
  rebalanceBandBps: 300,
  lastRebalanceAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  totalRebalances: 17,
};

export const MOCK_USER = {
  encryptedShares: "0x3a9f...c81e",
  encryptedPnl: "0x7b2a...f03c",
  depositHistory: [
    {
      chain: "Bitcoin",
      at: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      solanaTx: "5YrtGJFRtXc5e8iFQGSzVqYRd2BpWKm3NxZH7LmBFh2JzDgW4nMkQ8vPb6cUeTRs",
    },
    {
      chain: "Ethereum",
      at: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      solanaTx: "3KwLpNmQsJx9aYc2d7RvFbT4eHkGiUo6MnPr8WzXqVBfDsLt1AhE5CuGyOjZwIR",
    },
  ],
};

export const MOCK_REBALANCE_LOG = [
  {
    id: 1,
    fromChain: "Bitcoin",
    toChain: "Ethereum",
    guardCt: "0x9f3ab7c12e4d8f560a1b2c3d4e5f6789",
    at: new Date(Date.now() - 3 * 3600 * 1000),
    solanaTx: "5GrpdxWb3YmNqLkM8cFzR4VsHiP7eTjUoAXnK2dBwQ9fCvE6JgIyOu1LsDhZtRaM",
  },
  {
    id: 2,
    fromChain: "Ethereum",
    toChain: "Sui",
    guardCt: "0x2c1d9e4f7a3b60852d7c8e9f0a1b2c3d",
    at: new Date(Date.now() - 11 * 3600 * 1000),
    solanaTx: "3RvKmTxPqNsGjE8bZaHdL6WoYcF2iU9AXnM4kBwQ7fCvD5JgIyOu1LsDhZtRaM",
  },
  {
    id: 3,
    fromChain: "Bitcoin",
    toChain: "Zcash",
    guardCt: "0x9b4f1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
    at: new Date(Date.now() - 28 * 3600 * 1000),
    solanaTx: "7XzPsKwLnMqRtUoVbNhGiE3dF8cYjA2mB5vQ4eC6JgIyOu1LsDhZtRaMwFkX9pN",
  },
  {
    id: 4,
    fromChain: "Sui",
    toChain: "Bitcoin",
    guardCt: "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
    at: new Date(Date.now() - 52 * 3600 * 1000),
    solanaTx: "2MnQpRsKwLxTuVoWbNhGiE4dF7cYjA3mB6vQ5eC8JgIyOu1LsDhZtRaMwFkX9pN",
  },
];

export const ENCRYPTED_PLACEHOLDER = "••••••••••••••••";
export const CIPHER_SAMPLE = "3a9fc81e7b2af03c29d51048e6a7fc12";

export function solscanTxUrl(sig: string) {
  return `${SOLSCAN_BASE}/${sig}${SOLSCAN_CLUSTER}`;
}

export function shortSig(sig: string) {
  return sig.slice(0, 6) + "…" + sig.slice(-4);
}

export function randomCipherChunk() {
  return Math.random().toString(16).slice(2, 10).toUpperCase();
}
