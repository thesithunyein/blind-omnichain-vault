import Link from "next/link";
import { ExternalLink, Shield, Lock, Globe, Zap, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    id: "overview",
    icon: Shield,
    color: "text-brand-400",
    bg: "bg-brand-950/30 border-brand-900",
    title: "Overview",
    content: `The Blind Omnichain Vault (BOV) is a Solana program that lets users deposit native cross-chain assets (BTC, ETH, etc.) without bridges using Ika dWallets, while keeping every position and rebalance strategy encrypted via Encrypt FHE. No observer — including validators — ever learns a user's balance or the vault's strategy.`,
  },
  {
    id: "ika",
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-950/20 border-blue-900/40",
    title: "Ika dWallets",
    content: `Ika uses a 2PC-MPC protocol to distribute private keys across a committee. A Solana program instruction can conditionally authorize a cross-chain signature without any party learning the key. BOV registers one dWallet per supported chain. When a deposit arrives, it stays on the native chain (e.g. Bitcoin) — the Solana program controls the spending key.`,
    code: `// On-chain CPI stub (programs/bov/src/ika.rs)
pub fn cpi_approve_dwallet_sign_if(
    ika_program: &AccountInfo,
    dwallet_id:  &[u8; 32],
    guard_ct:    &EncBool,   // FHE-encrypted boolean
) -> Result<()>`,
  },
  {
    id: "encrypt",
    icon: Lock,
    color: "text-purple-400",
    bg: "bg-purple-950/20 border-purple-900/40",
    title: "Encrypt FHE",
    content: `Encrypt provides a REFHE (Reusable FHE) protocol on Solana. Ciphertexts are stored on-chain as account data. Homomorphic operations (add, subtract, compare) run inside Solana without decryption. Threshold decryption only occurs when a user explicitly requests withdrawal — and only their own share is decrypted.`,
    code: `// Client-side encryption (sdk/src/encrypt.ts)
const ct = await encrypt.encryptU64(amountLamports);
// ct.bytes is a 1024-byte FHE ciphertext
// -> stored in UserLedger.encrypted_shares on-chain`,
  },
  {
    id: "flow",
    icon: Zap,
    color: "text-orange-400",
    bg: "bg-orange-950/20 border-orange-900/40",
    title: "Deposit → Rebalance → Withdraw",
    content: `1. User encrypts deposit amount client-side with Encrypt SDK.\n2. Solana instruction stores ciphertext in UserLedger account.\n3. Cranker calls request_rebalance — the program evaluates the rebalance policy purely on ciphertexts (FHE compare).\n4. If the FHE guard evaluates to encrypted-true, Ika CPI authorizes a native cross-chain transfer.\n5. Withdrawal triggers threshold decryption of only the caller's share.`,
    code: `// Rebalance policy (programs/bov/src/policy.rs)
let diff     = fhe_sub(actual_ct, target_ct)?;
let exceeded = fhe_gt(diff, band_ct)?;
// exceeded is EncBool — never decrypted on-chain
cpi_approve_dwallet_sign_if(ika_program, dwallet_id, &exceeded)`,
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 animate-fade-in">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-white tracking-tight mb-3">Documentation</h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
          Technical reference for the Blind Omnichain Vault. For the full architecture doc,{" "}
          <Link
            href="https://github.com/thesithunyein/blind-omnichain-vault/blob/main/docs/architecture.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:underline inline-flex items-center gap-1"
          >
            see GitHub <ExternalLink className="h-3 w-3" />
          </Link>.
        </p>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 mb-12">
        {SECTIONS.map(s => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-card px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            <s.icon className={`h-3 w-3 ${s.color}`} />
            {s.title}
          </a>
        ))}
      </div>

      <div className="space-y-10">
        {SECTIONS.map(({ id, icon: Icon, color, bg, title, content, code }) => (
          <section key={id} id={id} className="scroll-mt-20">
            <div className={`rounded-2xl border ${bg} overflow-hidden`}>
              <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-black/30 border border-white/5`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <h2 className="text-base font-bold text-white">{title}</h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{content}</p>
                {code && (
                  <pre className="rounded-xl border border-surface-border bg-surface overflow-x-auto p-4 text-xs text-brand-300 font-mono leading-relaxed">
                    <code>{code}</code>
                  </pre>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Threat model */}
      <section className="mt-10 rounded-2xl border border-surface-border bg-surface-card overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-border">
          <h2 className="text-base font-bold text-white">Threat Model</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-3 text-left">Threat</th>
                <th className="px-6 py-3 text-left">Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {[
                ["MEV / front-run rebalance",     "Rebalance trigger is an encrypted boolean — unreadable by searchers"],
                ["Balance surveillance",           "All balances are FHE ciphertexts on-chain"],
                ["Bridge hack (wrapped asset)",    "No bridge — native custody via Ika 2PC-MPC dWallets"],
                ["Unauthorized withdrawal",        "Threshold decrypt only runs on explicit user request + Solana signer check"],
                ["Rogue cranker",                  "Cranker can only call request_rebalance; gated by the FHE guard evaluation"],
                ["Vault key compromise",            "Ika committee threshold > f+1; single node cannot sign alone"],
              ].map(([threat, mitigation]) => (
                <tr key={threat} className="hover:bg-surface-muted/20 transition-colors">
                  <td className="px-6 py-4 text-zinc-300 align-top">{threat}</td>
                  <td className="px-6 py-4 text-brand-300 text-xs">{mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-brand-900 bg-brand-950/20 p-6">
        <div className="flex-1">
          <p className="text-sm font-bold text-white mb-1">Ready to try it?</p>
          <p className="text-xs text-zinc-400">Connect your Solana wallet and make a blind deposit.</p>
        </div>
        <Link
          href="/deposit"
          className="flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-all shrink-0"
        >
          Go to Deposit <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
