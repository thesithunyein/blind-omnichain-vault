import Link from "next/link";
import { Lock, Zap, Globe, ArrowRight, Bitcoin, ExternalLink, ShieldCheck, Eye, RefreshCw, ChevronRight } from "lucide-react";
import { EncryptedBadge } from "@/components/EncryptedBadge";
import { BovLogo } from "@/components/BovLogo";
import { MOCK_VAULT, SOLSCAN_PROGRAM_URL } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Layered ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-brand-500/6 blur-[130px]" />
        <div className="absolute top-1/3 left-1/4 h-[300px] w-[400px] rounded-full bg-brand-600/4 blur-[100px]" />
        <div className="absolute top-1/2 right-1/4 h-[250px] w-[300px] rounded-full bg-purple-600/3 blur-[100px]" />
      </div>

      {/* ─── Hero ───────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-16 text-center animate-fade-in">
        {/* Bounty pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/8 px-4 py-1.5 text-xs font-medium text-brand-300 mb-10">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
          Colosseum Frontier · Encrypt × Ika Bounty
          <ChevronRight className="h-3 w-3 opacity-50" />
        </div>

        {/* Logo + headline */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="animate-float">
            <BovLogo size={72} />
          </div>
          <h1 className="text-[clamp(2.6rem,8vw,5.5rem)] font-black tracking-[-0.03em] text-white leading-[1.02]">
            Bridgeless.{" "}
            <span className="gradient-text">Blind.</span>
            <br />
            Omnichain Vault.
          </h1>
        </div>

        <p className="mx-auto max-w-xl text-base sm:text-lg text-zinc-400 mb-10 leading-relaxed">
          Custodies <span className="text-white font-medium">native BTC, ETH &amp; more</span> without
          bridges via <span className="text-brand-400 font-medium">Ika dWallets</span>. Every balance,
          weight, and rebalance trigger stays a{" "}
          <span className="text-white font-medium">ciphertext on-chain</span> via{" "}
          <span className="text-brand-400 font-medium">Encrypt FHE</span>.
        </p>

        {/* Live encrypted NAV pill */}
        <div className="inline-flex items-center gap-3 glass rounded-2xl px-5 py-3 mb-10">
          <Lock className="h-3.5 w-3.5 text-brand-400 shrink-0" />
          <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Vault NAV</span>
          <EncryptedBadge size="lg" />
          <span className="text-[11px] text-zinc-600">always encrypted</span>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/deposit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-brand-500 hover:bg-brand-400 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 shadow-glow-md hover:shadow-glow-lg"
          >
            Deposit Now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 glass rounded-2xl px-7 py-3.5 text-sm font-medium text-zinc-300 hover:text-white transition-all duration-200"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      {/* ─── Stats row ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Depositors",      value: MOCK_VAULT.totalDepositors,     suffix: "" },
            { label: "dWallets Active",  value: MOCK_VAULT.dwalletCount,        suffix: "" },
            { label: "Chains",           value: MOCK_VAULT.chains.length,       suffix: "" },
            { label: "MEV Exposed",      value: "0",                            suffix: "" },
          ].map(({ label, value, suffix }) => (
            <div key={label} className="glass rounded-2xl p-5 text-center">
              <p className="text-3xl font-black text-white tracking-tight">{value}{suffix}</p>
              <p className="mt-1 text-xs text-zinc-500 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Dual problem cards ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-4 pb-20">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-10">
          Two unsolved problems · One vault
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-7 group hover:shadow-card-hover transition-all duration-300">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 mb-5">
              <Bitcoin className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 tracking-tight">Cross-chain custody is broken</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-5">
              Every bridge connecting BTC to Solana is a liability. Billions lost this cycle.
              Wrapping is a derivative, not the real asset.
            </p>
            <div className="flex items-start gap-2.5 rounded-xl border border-brand-500/15 bg-brand-500/5 px-4 py-3 text-sm">
              <ShieldCheck className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
              <span className="text-brand-300 leading-relaxed">
                <strong className="text-white">Ika dWallets</strong> — native BTC stays on Bitcoin,
                controlled by a Solana program via 2PC-MPC. Zero bridges.
              </span>
            </div>
          </div>

          <div className="glass rounded-2xl p-7 group hover:shadow-card-hover transition-all duration-300">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 mb-5">
              <Eye className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 tracking-tight">Public execution leaks strategy</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-5">
              Every Solana vault today publishes its full book on-chain. MEV bots front-run
              rebalances. Institutions won&apos;t deploy capital in a glass house.
            </p>
            <div className="flex items-start gap-2.5 rounded-xl border border-brand-500/15 bg-brand-500/5 px-4 py-3 text-sm">
              <Lock className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
              <span className="text-brand-300 leading-relaxed">
                <strong className="text-white">Encrypt FHE</strong> — positions, weights, and
                rebalance triggers are ciphertexts. Policy runs on encrypted state.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="glass rounded-2xl overflow-hidden">
          <div className="border-b border-white/[0.06] px-6 py-4 flex items-center gap-2.5">
            <Globe className="h-4 w-4 text-brand-400" />
            <span className="text-sm font-semibold text-white">How it works</span>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.05]">
            {[
              { step: "01", title: "Deposit native", desc: "Send real BTC/ETH to your Ika dWallet address. Stays native — no bridge, no wrap.", color: "text-brand-400" },
              { step: "02", title: "Encrypt client-side", desc: "Amount converted to FHE ciphertext in-browser before any Solana instruction.", color: "text-purple-400" },
              { step: "03", title: "Strategy runs blind", desc: "Policy engine evaluates rebalance triggers on ciphertexts only. Zero plaintext leak.", color: "text-blue-400" },
              { step: "04", title: "Blind sign & settle", desc: "Ika co-signs cross-chain tx only if encrypted guard resolves true. No info revealed.", color: "text-orange-400" },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="p-6 group hover:bg-white/[0.02] transition-colors">
                <div className={`text-2xl font-black font-mono mb-3 ${color} opacity-80`}>{step}</div>
                <h4 className="text-sm font-semibold text-white mb-2 tracking-tight">{title}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tech + rebalances live ticker ──────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Tech stack */}
          <div className="flex-1 glass rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-4">Built with</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Ika dWallets",      color: "text-brand-300",  border: "border-brand-500/20",  bg: "bg-brand-500/8" },
                { label: "Encrypt FHE",       color: "text-purple-300", border: "border-purple-500/20", bg: "bg-purple-500/8" },
                { label: "Solana",             color: "text-blue-300",   border: "border-blue-500/20",   bg: "bg-blue-500/8" },
                { label: "2PC-MPC",            color: "text-zinc-300",   border: "border-white/10",      bg: "bg-white/4" },
                { label: "REFHE Protocol",     color: "text-zinc-300",   border: "border-white/10",      bg: "bg-white/4" },
                { label: "Threshold Decrypt",  color: "text-zinc-300",   border: "border-white/10",      bg: "bg-white/4" },
                { label: "Anchor",             color: "text-zinc-300",   border: "border-white/10",      bg: "bg-white/4" },
              ].map(({ label, color, border, bg }) => (
                <span key={label} className={`rounded-full border ${border} ${bg} px-3 py-1.5 text-xs font-medium ${color}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Live rebalances */}
          <div className="glass rounded-2xl p-6 min-w-[220px]">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-3.5 w-3.5 text-brand-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Live Rebalances</p>
            </div>
            <div className="text-4xl font-black text-white mb-1">{MOCK_VAULT.totalRebalances}</div>
            <p className="text-xs text-zinc-500">executed on devnet</p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-600">
              <Zap className="h-3 w-3 text-brand-500" />
              All guards consumed — never decrypted
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA banner ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <div className="relative overflow-hidden glass rounded-3xl p-8 sm:p-12 text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/6 via-transparent to-purple-500/4" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              Ready to go blind?
            </h2>
            <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto">
              Your first encrypted deposit takes under 60 seconds. No bridge. No plaintext.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/deposit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-brand-500 hover:bg-brand-400 px-8 py-3.5 text-sm font-semibold text-white transition-all shadow-glow-md hover:shadow-glow-lg"
              >
                Start Depositing <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="https://github.com/thesithunyein/blind-omnichain-vault"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 glass rounded-2xl px-8 py-3.5 text-sm font-medium text-zinc-300 hover:text-white transition-all"
              >
                <ExternalLink className="h-4 w-4" /> View Source
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
