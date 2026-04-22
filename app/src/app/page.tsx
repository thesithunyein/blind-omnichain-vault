import Link from "next/link";
import { Shield, Lock, Zap, Globe, ArrowRight, Bitcoin, ExternalLink } from "lucide-react";
import { EncryptedBadge } from "@/components/EncryptedBadge";
import { MOCK_VAULT } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
        <div className="h-[600px] w-[900px] rounded-full bg-brand-600/5 blur-[120px] -translate-y-1/2" />
      </div>

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-900 bg-brand-950/30 px-4 py-1.5 text-xs text-brand-400 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
          Colosseum Frontier — Encrypt × Ika Bounty
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-[1.05]">
          Bridgeless.{" "}
          <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
            Blind.
          </span>
          <br />
          Omnichain Vault.
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-zinc-400 mb-10 leading-relaxed">
          The first Solana vault that custodies{" "}
          <span className="text-white font-medium">native BTC, ETH, and more</span> without bridges
          via <span className="text-brand-400">Ika dWallets</span>, while keeping every position,
          strategy, and rebalance trigger{" "}
          <span className="text-white font-medium">cryptographically encrypted</span> via{" "}
          <span className="text-brand-400">Encrypt FHE</span>.
        </p>

        {/* Live encrypted NAV preview */}
        <div className="inline-flex items-center gap-3 rounded-xl border border-surface-border bg-surface-card px-6 py-4 mb-10">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Vault NAV</span>
          <EncryptedBadge size="lg" />
          <span className="text-xs text-zinc-600">always encrypted</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/deposit"
            className="flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-brand-900/50"
          >
            Deposit Now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-surface-border hover:border-brand-900 bg-surface-card hover:bg-surface-muted px-7 py-3.5 text-sm font-semibold text-zinc-300 hover:text-white transition-all"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      {/* ─── Why BOV ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-center text-xs uppercase tracking-widest text-zinc-600 mb-12">
          Two unsolved problems, one vault
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Problem 1 */}
          <div className="rounded-2xl border border-surface-border bg-surface-card p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-950/50 border border-orange-900/40 mb-5">
              <Bitcoin className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Cross-chain custody is broken</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              Every bridge that connects BTC to Solana is a liability — billions lost this cycle. Wrapping is a derivative, not the real asset.
            </p>
            <div className="rounded-lg border border-brand-900/50 bg-brand-950/20 px-4 py-3 text-sm text-brand-300">
              ✓ <strong>BOV uses Ika dWallets</strong> — native BTC stays on Bitcoin, controlled by a Solana program via 2PC-MPC. No bridge, no wrap.
            </div>
          </div>

          {/* Problem 2 */}
          <div className="rounded-2xl border border-surface-border bg-surface-card p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950/50 border border-purple-900/40 mb-5">
              <Lock className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Public execution leaks strategy</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              Every Solana vault today publishes its full book on-chain. MEV bots front-run rebalances. Institutions won&apos;t deploy capital in a glass house.
            </p>
            <div className="rounded-lg border border-brand-900/50 bg-brand-950/20 px-4 py-3 text-sm text-brand-300">
              ✓ <strong>BOV uses Encrypt FHE</strong> — positions, weights, and rebalance triggers are ciphertexts. The policy runs on encrypted data.
            </div>
          </div>
        </div>
      </section>

      {/* ─── Architecture strip ───────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl border border-surface-border bg-surface-card overflow-hidden">
          <div className="border-b border-surface-border px-6 py-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-brand-400" />
            <span className="text-sm font-semibold text-white">How it works</span>
          </div>
          <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-surface-border">
            {[
              {
                step: "1",
                title: "Deposit native asset",
                desc: "Ika creates a dWallet with your chain address. Send real BTC there — no bridge.",
                color: "text-brand-400",
              },
              {
                step: "2",
                title: "Encrypt on client",
                desc: "Your amount is encrypted into an FHE ciphertext before hitting the Solana program.",
                color: "text-purple-400",
              },
              {
                step: "3",
                title: "Strategy runs in the dark",
                desc: "The Solana policy engine evaluates rebalance triggers purely on ciphertexts via Encrypt.",
                color: "text-blue-400",
              },
              {
                step: "4",
                title: "Blind sign & broadcast",
                desc: "Ika co-signs the cross-chain tx only if the encrypted guard is true. Nobody sees the trigger.",
                color: "text-orange-400",
              },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="p-6">
                <div className={`text-3xl font-black font-mono mb-3 ${color}`}>{step}</div>
                <h4 className="text-sm font-semibold text-white mb-2">{title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Depositors", value: MOCK_VAULT.totalDepositors },
            { label: "dWallets Active",  value: MOCK_VAULT.dwalletCount },
            { label: "Chains Supported", value: MOCK_VAULT.chains.length },
            { label: "MEV Exposed", value: "0" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-surface-border bg-surface-card p-5 text-center">
              <p className="text-3xl font-black text-white">{value}</p>
              <p className="mt-1 text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tech badges ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-2xl border border-surface-border bg-gradient-to-br from-surface-card to-surface-muted p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Built with</p>
            <div className="flex flex-wrap gap-3">
              {["Ika dWallets", "Encrypt FHE", "Solana", "REFHE Protocol", "2PC-MPC", "Threshold Decrypt"].map((t) => (
                <span key={t} className="rounded-full border border-surface-border bg-surface px-3 py-1 text-xs text-zinc-300">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="https://github.com/thesithunyein/blind-omnichain-vault"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-surface-border hover:border-brand-900 px-5 py-2.5 text-sm text-zinc-400 hover:text-white transition-all shrink-0"
          >
            <ExternalLink className="h-4 w-4" /> View on GitHub
          </Link>
        </div>
      </section>

      {/* Power badges */}
      <div className="flex items-center justify-center gap-3 pb-8">
        <Zap className="h-3.5 w-3.5 text-brand-500" />
        <span className="text-xs text-zinc-600">Solana — fastest settlement on earth</span>
      </div>
    </div>
  );
}
