"use client";

import { useState } from "react";
import { Lock, Zap, Shield, ArrowRight, CheckCircle2, Activity } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const [targetPrice, setTargetPrice] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [cipherText, setCipherText] = useState<string | null>(null);
  const [vaultActive, setVaultActive] = useState(false);

  const handleDeposit = () => {
    if (!targetPrice) return;
    
    setIsEncrypting(true);
    setCipherText(null);

    // Simulate the FHE encryption and network delay
    setTimeout(() => {
      const fakeCipher = "0x" + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      
      setCipherText(fakeCipher);
      
      // Move to success dashboard after showing the ciphertext briefly
      setTimeout(() => {
        setIsEncrypting(false);
        setVaultActive(true);
      }, 1500);

    }, 2000);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30">
      <nav className="border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-bold text-lg tracking-tight">BlindVault</span>
          </div>
          <WalletMultiButton className="!bg-emerald-500 hover:!bg-emerald-600 transition-colors rounded-md font-medium text-sm px-4 py-2" />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: The Narrative */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium uppercase tracking-wider">
              <Zap className="w-3 h-3" /> Powered by Ika & Encrypt
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Omnichain Trading, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Zero Information.
              </span>
            </h1>
            <p className="text-neutral-400 text-lg md:text-xl leading-relaxed max-w-lg">
              Deposit assets on Solana and set a hidden target price. Our FHE smart contract executes the trade on Ethereum without ever decrypting your strategy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
              <Lock className="w-6 h-6 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-neutral-200">FHE Privacy</h3>
              <p className="text-sm text-neutral-500 mt-1">Target prices remain encrypted on-chain. Zero front-running risk.</p>
            </div>
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
              <Zap className="w-6 h-6 text-cyan-400 mb-3" />
              <h3 className="font-semibold text-neutral-200">MPC Execution</h3>
              <p className="text-sm text-neutral-500 mt-1">Solana directly controls an Ethereum dWallet. No wrapped tokens.</p>
            </div>
          </div>
        </div>

        {/* Right Column: The Interactive App */}
        <div className="p-1 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-900">
          <div className="bg-neutral-950 p-6 md:p-8 rounded-xl h-full flex flex-col relative overflow-hidden">
            
            {!vaultActive ? (
              // --- STATE 1: INPUT FORM ---
              <>
                <h2 className="text-2xl font-semibold mb-6">Create Strategy</h2>
                <div className="space-y-6 flex-grow">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400 block">Asset to Buy (Ethereum)</label>
                    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex items-center justify-between">
                      <span className="font-medium">WBTC</span>
                      <span className="text-neutral-500 text-sm">Targeting Uniswap V3</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400 block">Hidden Target Price (USD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                      <input 
                        type="number" 
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="65,000"
                        disabled={isEncrypting}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-4 pl-8 pr-4 text-lg focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className={`mt-6 p-4 rounded-lg font-mono text-xs border transition-all duration-500 ${isEncrypting || cipherText ? 'bg-black border-emerald-500/30' : 'bg-neutral-900 border-neutral-800 opacity-50'}`}>
                  <div className="flex items-center gap-2 mb-2 text-neutral-500">
                    <div className="w-2 h-2 rounded-full bg-neutral-700 animate-pulse"></div> Encrypt FHE Client
                  </div>
                  {isEncrypting && (
                    <div className="text-emerald-400/80 animate-pulse">
                      &gt; Encrypting payload with FHE public key...<br/>
                      &gt; Generating zero-knowledge proof...
                    </div>
                  )}
                  {cipherText && (
                    <div className="text-emerald-400 break-all">
                      <span className="text-neutral-500">&gt; Ciphertext generated:</span><br/>{cipherText}
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleDeposit}
                  disabled={isEncrypting || !targetPrice}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isEncrypting ? 'Encrypting & Signing...' : 'Encrypt & Deposit'}
                  {!isEncrypting && <ArrowRight className="w-5 h-5" />}
                </button>
              </>
            ) : (
              // --- STATE 2: ACTIVE VAULT DASHBOARD ---
              <div className="flex flex-col h-full animate-in fade-in zoom-in duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <h2 className="text-2xl font-semibold">Vault Secured</h2>
                </div>
                
                <div className="space-y-4 flex-grow">
                  <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
                    <p className="text-sm text-neutral-500 mb-1">Target Price (Encrypted on Solana)</p>
                    <div className="font-mono text-xs text-emerald-400/70 break-all">
                      {cipherText}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
                    <p className="text-sm text-neutral-500 mb-1">Cross-Chain Identity (Ika dWallet)</p>
                    <div className="font-mono text-sm">
                      0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-4">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <div>
                      <p className="font-medium text-emerald-400">Monitoring Oracle Network</p>
                      <p className="text-xs text-neutral-400">Awaiting FHE evaluation trigger to execute swap.</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setVaultActive(false)}
                  className="w-full mt-6 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-semibold py-3 rounded-lg transition-all"
                >
                  Create Another Strategy
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}