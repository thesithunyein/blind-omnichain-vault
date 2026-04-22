"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, ArrowDownToLine, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const NAV = [
  { href: "/",          label: "Home",      icon: Shield },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deposit",   label: "Deposit",   icon: ArrowDownToLine },
  { href: "/docs",      label: "Docs",      icon: BookOpen },
];

export function Navbar() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand-900 border border-brand-800 group-hover:glow-green transition-all">
            <Shield className="h-4 w-4 text-brand-400" />
          </div>
          <div className="leading-none">
            <div className="text-sm font-bold tracking-tight text-white">BOV</div>
            <div className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">Blind Omnichain Vault</div>
          </div>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                path === href
                  ? "bg-brand-900/60 text-brand-300 border border-brand-800"
                  : "text-zinc-400 hover:text-white hover:bg-surface-muted"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>

        {/* Wallet */}
        <WalletMultiButton />
      </nav>
    </header>
  );
}
