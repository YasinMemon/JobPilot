"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { STATUS_BADGE_CLASSES, DEFAULT_BADGE_CLASS } from "../constants";

// ─── ActivityRow ──────────────────────────────────────────────────────────────

interface ActivityRowProps {
  company: string;
  role: string;
  date: string;
  status: string;
}

/**
 * A single row in the Recent Activity table.
 * Status badge styling is driven entirely by STATUS_BADGE_CLASSES constants.
 */
export const ActivityRow = React.memo(function ActivityRow({
  company,
  role,
  date,
  status,
}: ActivityRowProps) {
  const badgeClass = STATUS_BADGE_CLASSES[status] ?? DEFAULT_BADGE_CLASS;

  return (
    <div className="flex items-center justify-between py-3 transition-colors hover:bg-[#161616] rounded-xl px-3 -mx-3 cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-[#27272a] text-xs font-bold text-zinc-400">
          {company[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="text-[13px] font-medium text-white">{company}</p>
          <p className="text-[11px] text-zinc-600">{role}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-zinc-600 hidden sm:block">{date}</span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${badgeClass}`}
        >
          {status}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
});

// ─── ActivitySkeleton ─────────────────────────────────────────────────────────

/**
 * Placeholder row shown while recent applications are loading.
 */
export function ActivitySkeleton() {
  return (
    <div className="flex items-center justify-between py-3 px-3 -mx-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-[#27272a]" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 rounded-full bg-[#27272a]" />
          <div className="h-2.5 w-20 rounded-full bg-[#1e1e1e]" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-3 w-16 rounded-full bg-[#1e1e1e] hidden sm:block" />
        <div className="h-5 w-16 rounded-full bg-[#27272a]" />
      </div>
    </div>
  );
}
