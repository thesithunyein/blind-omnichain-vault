"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowDownToLine, BookOpen, Menu, X, Home, Github } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { BovLogo } from "./BovLogo";

const NAV = [
  { href: "/",          label: "Home",      icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deposit",   label: "Deposit",   icon: ArrowDownToLine },
  { href: "/docs",      label: "Docs",      icon: BookOpen },
];

export function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-heavy">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0" onClick={() => setOpen(false)}>
          <div className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
            <BovLogo size={30} />
          </div>
          <div className="leading-none">
            <div className="text-sm font-bold tracking-tight text-white">BOV</div>
            <div className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase leading-none mt-0.5">Blind Omnichain Vault</div>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.06] rounded-full px-1.5 py-1.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150",
                path === href
                  ? "bg-brand-500/15 text-brand-300 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.2)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right: wallet + hamburger */}
        <div className="flex items-center gap-2">
          <WalletMultiButton />
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#0a0a0c]/95 backdrop-blur-2xl animate-slide-down">
          <div className="mx-auto max-w-7xl px-4 py-3 space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  path === href
                    ? "bg-brand-500/10 text-brand-300 border border-brand-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
