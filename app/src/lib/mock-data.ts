export const MOCK_VAULT = {
  id: "1",
  totalNavUsd: null,       // always null — encrypted
  totalDepositors: 47,
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
};

export const MOCK_USER = {
  encryptedShares: "0x3a9f...c81e",
  encryptedPnl: "0x7b2a...f03c",
  depositHistory: [
    { chain: "Bitcoin",  at: new Date(Date.now() - 2 * 24 * 3600 * 1000), txHash: "bc1a...f4d2" },
    { chain: "Ethereum", at: new Date(Date.now() - 5 * 24 * 3600 * 1000), txHash: "0x9f3a...22b1" },
  ],
};

export const MOCK_REBALANCE_LOG = [
  { id: 1, fromChain: "Bitcoin",  toChain: "Ethereum", guardCt: "0xenc...7f3a", at: new Date(Date.now() - 3 * 3600 * 1000),  solanaTx: "5Yrt...1bNq" },
  { id: 2, fromChain: "Ethereum", toChain: "Sui",      guardCt: "0xenc...2c1d", at: new Date(Date.now() - 11 * 3600 * 1000), solanaTx: "3KwL...9pRm" },
  { id: 3, fromChain: "Bitcoin",  toChain: "Zcash",    guardCt: "0xenc...9b4f", at: new Date(Date.now() - 28 * 3600 * 1000), solanaTx: "7Xz2...4cYt" },
];

export const ENCRYPTED_PLACEHOLDER = "••••••••••••••••";
export const CIPHER_SAMPLE = "3a9fc81e7b2af03c29d51048e6a7fc12";

export function randomCipherChunk() {
  return Math.random().toString(16).slice(2, 10).toUpperCase();
}
