"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EncryptedBadge } from "./EncryptedBadge";

interface Props {
  icon: LucideIcon;
  label: string;
  value?: string | number;
  encrypted?: boolean;
  delta?: string;
  accent?: string;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, encrypted = false, delta, accent = "brand", className }: Props) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-surface-border bg-surface-card p-5 transition-all hover:border-brand-900 hover:glow-green-sm",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border",
          accent === "brand" ? "border-brand-900 bg-brand-950/40" : "border-surface-border bg-surface-muted"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            accent === "brand" ? "text-brand-400" : "text-zinc-400"
          )} />
        </div>
        {delta && (
          <span className="text-xs text-brand-400 font-mono">+{delta}</span>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
        <div className="mt-1">
          {encrypted ? (
            <EncryptedBadge size="lg" />
          ) : (
            <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
          )}
        </div>
      </div>

      {/* subtle grid bg */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: "radial-gradient(circle at 50% 0%, #22c55e 0%, transparent 70%)" }}
      />
    </div>
  );
}
