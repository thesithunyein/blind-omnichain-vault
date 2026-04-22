"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
}

const CHARS = "0123456789ABCDEF";

function randomHex(len: number) {
  return Array.from({ length: len }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
}

export function EncryptedBadge({ label, size = "md", className, animate = true }: Props) {
  const hexLen = size === "sm" ? 8 : size === "lg" ? 24 : 14;
  const [hex, setHex] = useState(randomHex(hexLen));

  useEffect(() => {
    if (!animate) return;
    const id = setInterval(() => setHex(randomHex(hexLen)), 2200);
    return () => clearInterval(id);
  }, [hexLen, animate]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border bg-surface-card text-brand-400 font-mono transition-all duration-700",
        size === "sm" && "px-1.5 py-0.5 text-[10px] border-surface-border",
        size === "md" && "px-2 py-1 text-xs border-brand-900",
        size === "lg" && "px-3 py-1.5 text-sm border-brand-800",
        className
      )}
    >
      <Lock className={cn(
        "shrink-0",
        size === "sm" ? "w-2.5 h-2.5" : size === "lg" ? "w-4 h-4" : "w-3 h-3"
      )} />
      {label && <span className="text-zinc-400 mr-1">{label}</span>}
      <span className="opacity-70 animate-pulse-slow">0x{hex}…</span>
    </span>
  );
}
