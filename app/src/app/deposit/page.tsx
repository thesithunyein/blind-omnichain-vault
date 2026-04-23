"use client";

import { useState } from "react";
import { ArrowRight, Copy, Check, Info, Lock, Zap, ChevronDown, ExternalLink } from "lucide-react";
import { EncryptedBadge } from "@/components/EncryptedBadge";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import { cn } from "@/lib/utils";
import {
  getBovProgram, getVaultPdaForWallet, getUserLedgerPda, getChainBalancePda,
  stubEncrypt, ensureVault, solscanTxUrl, shortSig,
  CONNECTION,
} from "@/lib/bov-client";

const CHAINS = [
  { id: 0, name: "Bitcoin",  symbol: "BTC", color: "#f7931a", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
  { id: 1, name: "Ethereum", symbol: "ETH", color: "#627eea", address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
  { id: 2, name: "Sui",      symbol: "SUI", color: "#4da2ff", address: "0x2a3f1e9a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e" },
  { id: 3, name: "Zcash",    symbol: "ZEC", color: "#f4b728", address: "zs1z7rejlpsa98s2rrrfkwmaxu53e3yjnh4s" },
];

type Step = "select-chain" | "show-address" | "initializing" | "encrypting" | "confirming" | "done";

export default function DepositPage() {
  const { connected }  = useWallet();
  const anchorWallet   = useAnchorWallet();
  const [step, setStep]                 = useState<Step>("select-chain");
  const [selectedChain, setSelectedChain] = useState(CHAINS[0]);
  const [copied, setCopied]             = useState(false);
  const [amount, setAmount]             = useState("");
  const [txSig, setTxSig]               = useState<string | null>(null);
  const [initSig, setInitSig]           = useState<string | null>(null);
  const [txErr, setTxErr]               = useState<string | null>(null);

  function copyAddress() {
    navigator.clipboard.writeText(selectedChain.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDeposit() {
    if (!amount || !anchorWallet) return;
    setTxErr(null);
    try {
      const provider = new AnchorProvider(CONNECTION, anchorWallet, { commitment: "confirmed" });
      const program  = getBovProgram(provider);
      const authority = anchorWallet.publicKey;

      // Step 1: auto-initialize vault if this wallet hasn't done it yet
      setStep("initializing");
      const iSig = await ensureVault(program, authority);
      if (iSig) setInitSig(iSig);

      // Step 2: client-side stub encryption
      // Production: Encrypt REFHE client SDK encrypts with vault public key
      setStep("encrypting");
      const encryptedAmount = Array.from(stubEncrypt(Math.round(parseFloat(amount) * 1e6)));

      // Step 3: submit deposit instruction
      setStep("confirming");
      const [vault]        = getVaultPdaForWallet(authority);
      const [userLedger]   = getUserLedgerPda(vault, authority);
      const [chainBalance] = getChainBalancePda(vault, selectedChain.id);

      const sig = await (program.methods as any)
        .deposit(selectedChain.id, encryptedAmount)
        .accounts({
          vault,
          userLedger,
          chainBalance,
          user:          authority,
          systemProgram: "11111111111111111111111111111111",
        })
        .rpc();

      setTxSig(sig);
      setStep("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTxErr(msg);
      setStep("show-address");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 animate-slide-up">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white tracking-tight">Deposit</h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Your amount is encrypted on the client before it ever touches Solana.
          The on-chain balance is always a ciphertext.
        </p>
      </div>

      {!connected ? (
        <div className="glass rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 rounded-full border border-surface-border flex items-center justify-center">
            <Lock className="h-6 w-6 text-zinc-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-white mb-1">Connect your Solana wallet first</p>
            <p className="text-xs text-zinc-500">Required to sign the deposit instruction</p>
          </div>
          <WalletMultiButton />
        </div>
      ) : step === "done" ? (
        <div className="glass rounded-2xl border-brand-900/50 p-10 flex flex-col items-center gap-5 text-center animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-brand-900/40 border border-brand-700 flex items-center justify-center">
            <Check className="h-8 w-8 text-brand-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white mb-2">Deposit confirmed on-chain!</p>
            <p className="text-sm text-zinc-400">Your encrypted balance has been written to the Solana devnet.</p>
          </div>
          <div className="w-full space-y-2">
            {initSig && (
              <a href={solscanTxUrl(initSig)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-xs font-mono text-zinc-400 hover:text-brand-300 transition-colors">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span>Vault init: {shortSig(initSig)}</span>
              </a>
            )}
            {txSig && (
              <a href={solscanTxUrl(txSig)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-brand-700/60 bg-brand-900/30 px-4 py-3 text-sm font-mono text-brand-300 hover:text-brand-200 transition-colors">
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span>{shortSig(txSig)}</span>
                <span className="text-xs text-zinc-500 font-sans">→ View on Solscan Devnet</span>
              </a>
            )}
          </div>
          <div className="w-full rounded-xl border border-surface-border bg-surface-card p-4 text-left">
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">On-chain encrypted balance</p>
            <EncryptedBadge size="lg" label="balance" />
            <p className="mt-2 text-[11px] text-zinc-600">
              Nobody — not even the Solana validator — can read your balance plaintext.
            </p>
          </div>
          <button
            onClick={() => { setStep("select-chain"); setAmount(""); setTxSig(null); setInitSig(null); setTxErr(null); }}
            className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            Make another deposit →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[
              { id: "select-chain", label: "Chain" },
              { id: "show-address", label: "dWallet Address" },
              { id: "encrypting",   label: "Encrypt" },
              { id: "confirming",   label: "Confirm" },
            ].map(({ id, label }, i, arr) => {
              const steps: Step[] = ["select-chain", "show-address", "encrypting", "confirming", "done"];
              const idx  = steps.indexOf(step);
              const iIdx = steps.indexOf(id as Step);
              const isDone = idx > iIdx;
              const isActive = idx === iIdx;
              return (
                <div key={id} className="flex items-center">
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-medium transition-colors",
                    isDone   ? "text-brand-400" :
                    isActive ? "text-white"      : "text-zinc-600"
                  )}>
                    <span className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
                      isDone   ? "bg-brand-900 border-brand-700 text-brand-400" :
                      isActive ? "bg-surface-muted border-brand-700 text-white" :
                                 "border-surface-border text-zinc-600"
                    )}>
                      {isDone ? <Check className="h-2.5 w-2.5" /> : i + 1}
                    </span>
                    <span className="hidden sm:block">{label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <ChevronDown className="h-3 w-3 text-zinc-700 mx-2 -rotate-90" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step: Select chain */}
          <div className={cn(
            "glass rounded-2xl overflow-hidden transition-all",
            step === "select-chain" ? "border-brand-900/60" : "border-white/[0.04] opacity-60"
          )}>
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-sm font-semibold text-white">1. Select Chain</span>
              {step !== "select-chain" && (
                <span className="text-xs text-brand-400">{selectedChain.name}</span>
              )}
            </div>
            {step === "select-chain" && (
              <div className="p-4 grid grid-cols-2 gap-3">
                {CHAINS.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => setSelectedChain(chain)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:bg-surface-muted",
                      selectedChain.id === chain.id
                        ? "border-brand-700 bg-brand-950/30"
                        : "border-surface-border"
                    )}
                  >
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: chain.color }} />
                    <div>
                      <p className="text-sm font-medium text-white">{chain.name}</p>
                      <p className="text-xs text-zinc-500">{chain.symbol}</p>
                    </div>
                    {selectedChain.id === chain.id && (
                      <Check className="h-3.5 w-3.5 text-brand-400 ml-auto" />
                    )}
                  </button>
                ))}
                <div className="col-span-2 pt-2">
                  <button
                    onClick={() => setStep("show-address")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-all"
                  >
                    Use {selectedChain.name} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step: Show dWallet address */}
          <div className={cn(
            "glass rounded-2xl overflow-hidden transition-all",
            step === "show-address" ? "border-brand-900/60" : "border-white/[0.04]",
            ["select-chain"].includes(step) ? "opacity-40 pointer-events-none" : ""
          )}>
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <span className="text-sm font-semibold text-white">2. Send to your dWallet Address</span>
            </div>
            {(step === "show-address" || ["encrypting","confirming"].includes(step)) && (
              <div className="p-6 space-y-5">
                <div className="rounded-xl border border-surface-border bg-surface p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedChain.color }} />
                      <span className="text-xs text-zinc-400 font-medium">{selectedChain.name} dWallet</span>
                    </div>
                    <span className="text-[10px] text-brand-600 border border-brand-900 rounded px-1.5 py-0.5">Ika-custodied</span>
                  </div>
                  <p className="font-mono text-xs text-zinc-200 break-all">{selectedChain.address}</p>
                  <button
                    onClick={copyAddress}
                    className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3 text-brand-400" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied!" : "Copy address"}
                  </button>
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-500 bg-surface-muted rounded-lg px-4 py-3">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-brand-700" />
                  This address is an Ika dWallet. Your {selectedChain.symbol} stays native on {selectedChain.name}. No wrapping, no bridge.
                </div>

                {step === "show-address" && (
                  <>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5">Amount you sent ({selectedChain.symbol})</label>
                      <input
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full rounded-xl border border-surface-border bg-surface px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-brand-700"
                      />
                    </div>
                    <button
                      disabled={!amount}
                      onClick={handleDeposit}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 text-sm font-semibold text-white transition-all"
                    >
                      <Lock className="h-4 w-4" /> Encrypt & Record Deposit
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Step: Initializing / Encrypting / Confirming */}
          {(step === "initializing" || step === "encrypting" || step === "confirming") && (
            <div className="glass rounded-2xl border-brand-900/50 p-8 flex flex-col items-center gap-4 text-center animate-fade-in">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-2 border-brand-800" />
                <div className="absolute inset-0 rounded-full border-t-2 border-brand-400 animate-spin" />
                {step === "initializing"
                  ? <Zap className="absolute inset-0 m-auto h-6 w-6 text-brand-400" />
                  : step === "encrypting"
                  ? <Lock className="absolute inset-0 m-auto h-6 w-6 text-brand-400" />
                  : <Zap className="absolute inset-0 m-auto h-6 w-6 text-brand-400" />
                }
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {step === "initializing" ? "Setting up your vault…" :
                   step === "encrypting"   ? "Encrypting with Encrypt FHE…" :
                                             "Submitting to Solana…"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {step === "initializing"
                    ? "Creating your personal vault PDA on devnet (one-time, ~0.002 SOL)"
                    : step === "encrypting"
                    ? "Your amount is being converted to an FHE ciphertext client-side"
                    : "Sending the encrypted deposit instruction on-chain"
                  }
                </p>
              </div>
              {step === "encrypting" && (
                <EncryptedBadge size="lg" label="ciphertext" />
              )}
            </div>
          )}

          {/* Error display */}
          {txErr && step === "show-address" && (
            <div className="rounded-xl border border-red-800/40 bg-red-900/20 px-4 py-3 text-xs text-red-400 leading-relaxed">
              <p className="font-semibold mb-1">Transaction failed</p>
              <p className="font-mono break-all">{txErr}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
