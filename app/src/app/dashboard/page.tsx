"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Wallet, RefreshCw, Clock, CheckCircle, AlertTriangle, ExternalLink, LogOut } from "lucide-react";
import { EncryptedBadge } from "@/components/EncryptedBadge";
import { StatCard } from "@/components/StatCard";
import { shortAddress } from "@/lib/utils";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
  getBovProgram, getVaultPdaForWallet, getUserLedgerPda,
  solscanTxUrl, shortSig,
  CONNECTION, PROGRAM_ID,
} from "@/lib/bov-client";

const CHAIN_COLORS: Record<string, string> = {
  Bitcoin:  "#f7931a",
  Ethereum: "#627eea",
  Sui:      "#4da2ff",
  Zcash:    "#f4b728",
};

const MOCK_CHAINS = [
  { name: "Bitcoin",  symbol: "BTC", targetBps: 6000 },
  { name: "Ethereum", symbol: "ETH", targetBps: 2500 },
  { name: "Sui",      symbol: "SUI", targetBps: 1000 },
  { name: "Zcash",    symbol: "ZEC", targetBps:  500 },
];

type UserPosition = {
  depositCount: number;
  encShares: number[];
  hasPosition: boolean;
};

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [loadingPos, setLoadingPos] = useState(false);
  const [withdrawSig, setWithdrawSig] = useState<string | null>(null);
  const [rebalanceSig, setRebalanceSig] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const fetchPosition = useCallback(async () => {
    if (!publicKey) { setPosition(null); return; }
    setLoadingPos(true);
    try {
      const [vault] = getVaultPdaForWallet(publicKey);
      const [ledgerPda] = getUserLedgerPda(vault, publicKey);
      const info = await CONNECTION.getAccountInfo(ledgerPda);
      if (!info) {
        setPosition({ depositCount: 0, encShares: [], hasPosition: false });
      } else {
        const provider = new AnchorProvider(CONNECTION, anchorWallet!, { commitment: "confirmed" });
        const program = getBovProgram(provider);
        const ledger = await (program.account as any).userLedger.fetch(ledgerPda);
        setPosition({
          depositCount: Number(ledger.depositCount),
          encShares: Array.from(ledger.encShares as number[]),
          hasPosition: true,
        });
      }
    } catch { setPosition(null); }
    finally { setLoadingPos(false); }
  }, [publicKey, anchorWallet]);

  useEffect(() => { fetchPosition(); }, [fetchPosition]);

  async function handleWithdraw() {
    if (!anchorWallet) return;
    setActionErr(null);
    try {
      const provider = new AnchorProvider(CONNECTION, anchorWallet, { commitment: "confirmed" });
      const program  = getBovProgram(provider);
      const [vault]  = getVaultPdaForWallet(anchorWallet.publicKey);
      const [userLedger] = getUserLedgerPda(vault, anchorWallet.publicKey);
      const sig = await (program.methods as any)
        .withdraw(0)
        .accounts({ vault, userLedger, user: anchorWallet.publicKey })
        .rpc();
      setWithdrawSig(sig);
      await fetchPosition();
    } catch (e: unknown) {
      setActionErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleRebalance() {
    if (!anchorWallet) return;
    setActionErr(null);
    try {
      const provider = new AnchorProvider(CONNECTION, anchorWallet, { commitment: "confirmed" });
      const program  = getBovProgram(provider);
      const [vault]  = getVaultPdaForWallet(anchorWallet.publicKey);
      const digest   = new Uint8Array(32);
      crypto.getRandomValues(digest);
      const sig = await (program.methods as any)
        .requestRebalance(0, 1, Array.from(digest))
        .accounts({ vault, cranker: anchorWallet.publicKey })
        .rpc();
      setRebalanceSig(sig);
    } catch (e: unknown) {
      setActionErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 animate-fade-in">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Vault Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            All balances and strategies are encrypted — only you can decrypt your share.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
          <span className="text-zinc-400">Solana Devnet</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500 font-mono">
            {connected && publicKey ? shortAddress(publicKey.toBase58()) : "Not connected"}
          </span>
        </div>
      </div>

      {/* ── Top stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Wallet}   label="Total NAV"       encrypted />
        <StatCard icon={Users}    label="Depositors"      value={"–"} />
        <StatCard icon={RefreshCw} label="Your Deposits"  value={position?.depositCount ?? (loadingPos ? "…" : "–")} />
        <StatCard icon={Clock}    label="Position"        value={position?.hasPosition ? "Active" : "–"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ── Chain allocation ──────────────────────────────────── */}
        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
          <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Chain Allocation</span>
            <span className="text-xs text-zinc-600 hidden sm:block">Targets · display only</span>
          </div>
          <div className="p-6 space-y-5">
            {MOCK_CHAINS.map((chain) => (
              <div key={chain.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: CHAIN_COLORS[chain.name] ?? "#888" }}
                    />
                    <span className="text-sm font-medium text-white">{chain.name}</span>
                    <span className="text-xs text-zinc-600">{chain.symbol}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">
                      Target {(chain.targetBps / 100).toFixed(0)}%
                    </span>
                    <EncryptedBadge size="sm" label="balance" />
                  </div>
                </div>
                {/* weight bar - target only (balance is hidden) */}
                <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full rounded-full opacity-60"
                    style={{
                      width: `${chain.targetBps / 100}%`,
                      backgroundColor: CHAIN_COLORS[chain.name] ?? "#888",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.05] px-6 py-3 flex items-center gap-2 text-xs text-zinc-600">
            <AlertTriangle className="h-3.5 w-3.5 text-zinc-700" />
            Actual weights are FHE ciphertexts. Bars show configured targets only.
          </div>
        </div>

        {/* ── Your position ─────────────────────────────────────── */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <span className="text-sm font-semibold text-white">Your Position</span>
          </div>
          <div className="p-6 space-y-4">
            {connected ? (
              <>
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Encrypted Shares</p>
                  <EncryptedBadge size="lg" label="shares" />
                </div>
                {loadingPos && (
                  <p className="text-xs text-zinc-600 animate-pulse">Fetching your PDA…</p>
                )}
                {!loadingPos && position && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-500 leading-relaxed">
                    {position.hasPosition ? (
                      <>
                        <p className="text-brand-400 font-semibold mb-1">Position Active</p>
                        <p>Deposits recorded: <span className="text-white">{position.depositCount}</span></p>
                        <p className="mt-1 text-[11px] text-zinc-600">
                          Only you can trigger threshold decryption at withdrawal.
                        </p>
                      </>
                    ) : (
                      <p>No position yet. Make a deposit to create your on-chain ledger.</p>
                    )}
                  </div>
                )}
                {actionErr && (
                  <div className="rounded-lg border border-red-800/40 bg-red-900/20 px-3 py-2 text-xs text-red-400">
                    {actionErr}
                  </div>
                )}
                {(withdrawSig || rebalanceSig) && (
                  <div className="space-y-1.5">
                    {rebalanceSig && (
                      <a href={solscanTxUrl(rebalanceSig)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] font-mono text-brand-400 hover:text-brand-300">
                        <ExternalLink className="h-3 w-3" />
                        Rebalance: {shortSig(rebalanceSig)}
                      </a>
                    )}
                    {withdrawSig && (
                      <a href={solscanTxUrl(withdrawSig)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] font-mono text-brand-400 hover:text-brand-300">
                        <ExternalLink className="h-3 w-3" />
                        Withdraw: {shortSig(withdrawSig)}
                      </a>
                    )}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleRebalance}
                    disabled={!position?.hasPosition}
                    className="flex-1 rounded-xl border border-brand-700/60 bg-brand-900/30 py-2.5 text-xs font-semibold text-brand-300 hover:bg-brand-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Rebalance
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={!position?.hasPosition}
                    className="flex-1 rounded-xl border border-red-700/40 bg-red-900/20 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Withdraw
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="h-12 w-12 rounded-full border border-surface-border flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-500">Connect wallet to see your encrypted position</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── On-chain activity log ──────────────────────────────────────── */}
      <div className="mt-4 glass rounded-2xl overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-brand-400" />
            <span className="text-sm font-semibold text-white">On-chain Activity</span>
          </div>
          <a
            href={`https://solscan.io/account/${PROGRAM_ID.toBase58()}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-brand-300 transition-colors"
          >
            Program on Solscan <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.05] text-zinc-600 uppercase tracking-wider">
                <th className="px-6 py-3 text-left">Action</th>
                <th className="px-6 py-3 text-left">Guard / Data</th>
                <th className="px-6 py-3 text-left">Solana Tx</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {!rebalanceSig && !withdrawSig ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-zinc-600">
                    No on-chain activity yet this session. Use Rebalance or Withdraw above to record a real transaction.
                  </td>
                </tr>
              ) : (
                <>
                  {rebalanceSig && (
                    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <span style={{ color: CHAIN_COLORS.Bitcoin }}>BTC</span>
                        <span className="text-zinc-600 mx-1">→</span>
                        <span style={{ color: CHAIN_COLORS.Ethereum }}>ETH</span>
                      </td>
                      <td className="px-6 py-4"><EncryptedBadge size="sm" animate={false} /></td>
                      <td className="px-6 py-4">
                        <a href={solscanTxUrl(rebalanceSig)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-zinc-400 hover:text-brand-300 transition-colors group">
                          {shortSig(rebalanceSig)}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 text-brand-400">
                          <CheckCircle className="h-3 w-3" /> Executed
                        </span>
                      </td>
                    </tr>
                  )}
                  {withdrawSig && (
                    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-red-400">Withdraw</td>
                      <td className="px-6 py-4"><EncryptedBadge size="sm" animate={false} /></td>
                      <td className="px-6 py-4">
                        <a href={solscanTxUrl(withdrawSig)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-zinc-400 hover:text-brand-300 transition-colors group">
                          {shortSig(withdrawSig)}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 text-brand-400">
                          <CheckCircle className="h-3 w-3" /> Executed
                        </span>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
