"use client";

import React from "react";
import { TrendingUp } from "lucide-react";

// ─── StatCard Skeleton ────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="group relative rounded-2xl border border-[#27272a] bg-[#111111] p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-[#27272a]" />
        <div className="h-4 w-12 rounded-full bg-[#27272a]" />
      </div>
      <div className="h-7 w-16 rounded-lg bg-[#27272a] mb-2" />
      <div className="h-3 w-24 rounded-full bg-[#27272a]" />
    </div>
  );
}

// ─── StatCard Props ───────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

/**
 * A single dashboard metric card with icon, value, label, and trend indicator.
 * Shows a skeleton placeholder while data is loading.
 */
export const StatCard = React.memo(function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  iconBg,
  iconColor,
  loading,
}: StatCardProps) {
  if (loading) return <StatCardSkeleton />;

  return (
    <div className="group relative rounded-2xl border border-[#27272a] bg-[#111111] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#3f3f46] hover:shadow-xl hover:shadow-black/50">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-medium ${
            trendUp ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          <TrendingUp className={`h-3 w-3 ${!trendUp ? "rotate-180" : ""}`} />
          {trend}
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
});
