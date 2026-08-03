"use client";

import React from "react";
import { Zap } from "lucide-react";
import { useUsage } from "../hooks/useUsage";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function UsageSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 bg-[#27272a] rounded w-16" />
      <div className="h-1.5 w-full rounded-full bg-[#27272a]" />
      <div className="h-2.5 bg-[#1f1f1f] rounded w-2/3" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UsageCard() {
  const { data: usage, isLoading } = useUsage();

  const creditsUsed = usage?.creditsUsed ?? 0;
  const creditsTotal = usage?.creditsTotal ?? 100;
  const pct = usage?.percentUsed ?? 0;

  const barColor =
    pct >= 80
      ? "from-rose-500 to-red-600"
      : pct >= 60
        ? "from-amber-500 to-orange-500"
        : "from-indigo-500 to-purple-600";

  return (
    <div className="rounded-2xl border border-[#27272a] bg-[#111111] p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20">
          <Zap className="h-3.5 w-3.5 text-indigo-400" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-white">{"Today's Usage"}</p>
          <p className="text-[10px] text-zinc-600">Resets at midnight</p>
        </div>
      </div>

      {isLoading ? (
        <UsageSkeleton />
      ) : (
        <>
          {/* Usage numbers */}
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              {creditsUsed}
            </span>
            <span className="text-[12px] text-zinc-500">/ {creditsTotal} credits</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-[#27272a] overflow-hidden mb-2">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-[10px] text-zinc-600">
            {usage?.creditsRemaining ?? creditsTotal} credits remaining today
          </p>

          {/* Additional stats */}
          {usage && (
            <div className="mt-3 pt-3 border-t border-[#1a1a1a] grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-zinc-600">Messages</p>
                <p className="text-[12px] font-semibold text-zinc-300">{usage.messages}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600">Tokens</p>
                <p className="text-[12px] font-semibold text-zinc-300">
                  {usage.tokensUsed.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
