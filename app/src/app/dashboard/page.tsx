"use client";

import { Users, Wallet, RefreshCw, Clock, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { EncryptedBadge } from "@/components/EncryptedBadge";
import { StatCard } from "@/components/StatCard";
import { SOLSCAN_PROGRAM_URL } from "@/lib/mock-data";
import { MOCK_VAULT, MOCK_USER, MOCK_REBALANCE_LOG, solscanTxUrl, shortSig } from "@/lib/mock-data";
import { timeAgo, shortAddress } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";

const CHAIN_COLORS: Record<string, string> = {
  Bitcoin:  "#f7931a",
  Ethereum: "#627eea",
  Sui:      "#4da2ff",
  Zcash:    "#f4b728",
};

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();

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
        <StatCard icon={Users}    label="Depositors"      value={MOCK_VAULT.totalDepositors} delta="3" />
        <StatCard icon={RefreshCw} label="Active dWallets" value={MOCK_VAULT.dwalletCount} />
        <StatCard icon={Clock}    label="Last Rebalance"  value={timeAgo(MOCK_VAULT.lastRebalanceAt)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ── Chain allocation ──────────────────────────────────── */}
        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
          <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Chain Allocation</span>
            <span className="text-xs text-zinc-600 hidden sm:block">Targets · display only</span>
          </div>
          <div className="p-6 space-y-5">
            {MOCK_VAULT.chains.map((chain) => (
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
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Encrypted P&amp;L</p>
                  <EncryptedBadge size="lg" label="pnl" />
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-500 leading-relaxed">
                  Your balance is encrypted under the vault key. Only <em>you</em> can trigger threshold decryption at withdrawal.
                </div>
                <div className="pt-2">
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Deposits</p>
                  {MOCK_USER.depositHistory.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: CHAIN_COLORS[d.chain] ?? "#888" }}
                        />
                        <span className="text-xs text-zinc-300">{d.chain}</span>
                      </div>
                      <div className="text-right">
                        <a
                          href={solscanTxUrl(d.solanaTx)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-brand-300 transition-colors"
                        >
                          {shortSig(d.solanaTx)}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{timeAgo(d.at)}</p>
                      </div>
                    </div>
                  ))}
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

      {/* ── Rebalance log ─────────────────────────────────────────── */}
      <div className="mt-4 glass rounded-2xl overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-brand-400" />
            <span className="text-sm font-semibold text-white">Rebalance Log</span>
          </div>
          <span className="text-xs text-zinc-600">Guards are consumed ciphertexts — never revealed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.05] text-zinc-600 uppercase tracking-wider">
                <th className="px-6 py-3 text-left">Route</th>
                <th className="px-6 py-3 text-left">Guard Ciphertext</th>
                <th className="px-6 py-3 text-left">Solana Tx</th>
                <th className="px-6 py-3 text-left">When</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_REBALANCE_LOG.map((r) => (
                <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium">
                    <span style={{ color: CHAIN_COLORS[r.fromChain] }}>{r.fromChain}</span>
                    <span className="text-zinc-600 mx-1">→</span>
                    <span style={{ color: CHAIN_COLORS[r.toChain] }}>{r.toChain}</span>
                  </td>
                  <td className="px-6 py-4">
                    <EncryptedBadge size="sm" animate={false} />
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={solscanTxUrl(r.solanaTx)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-zinc-400 hover:text-brand-300 transition-colors group"
                    >
                      {shortSig(r.solanaTx)}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">{timeAgo(r.at)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 text-brand-400">
                      <CheckCircle className="h-3 w-3" /> Executed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
