import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { SolanaWalletProvider } from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "Blind Omnichain Vault | BOV",
  description:
    "The first Solana vault that custodies native BTC/ETH without bridges (Ika dWallets) and runs strategy on encrypted state (Encrypt FHE). Bridgeless + Blind.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "Blind Omnichain Vault",
    description: "Bridgeless + Blind. Multi-chain DeFi with cryptographic privacy.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface text-white antialiased">
        <SolanaWalletProvider>
          <Navbar />
          <main>{children}</main>
          <footer className="mt-24 border-t border-surface-border py-8">
            <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
              <p>© 2026 Blind Omnichain Vault — Colosseum Frontier submission</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                  Solana Devnet
                </span>
                <a
                  href="https://solscan.io/account/6jkfCwYGm33xFqBfajHHWxcnG1YJzm2Jd7cME2jUNaaf?cluster=devnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono hover:text-white transition-colors"
                >
                  6jkf…Naaf ↗
                </a>
                <a
                  href="https://github.com/thesithunyein/blind-omnichain-vault"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub →
                </a>
              </div>
            </div>
          </footer>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
