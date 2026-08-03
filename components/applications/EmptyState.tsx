"use client";

import { Inbox, Mail, Loader2 } from "lucide-react";

interface EmptyStateProps {
  onSync?: () => void;
  isSyncing?: boolean;
}

export default function EmptyState({ onSync, isSyncing }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] px-8 text-center">
      {/* Illustration */}
      <div className="relative mb-6">
        {/* Glow rings */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-2xl scale-150" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-xl scale-125" />

        {/* Icon container */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#27272a] bg-[#111111]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20">
            <Inbox className="h-6 w-6 text-blue-400" />
          </div>

          {/* Floating envelope badge */}
          <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <Mail className="h-3.5 w-3.5 text-white" />
          </div>

          {/* Pulse dot */}
          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-[#111111] animate-pulse" />
        </div>
      </div>

      {/* Text */}
      <h2 className="text-lg font-bold text-white mb-2">
        No Applications Yet
      </h2>
      <p className="text-[13px] text-zinc-500 max-w-[280px] leading-relaxed mb-6">
        Your synced job applications will appear here. Connect your Gmail to
        automatically track every application.
      </p>

      {/* Tags */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {["Auto-sync", "AI Summaries", "Status Tracking", "Smart Filters"].map(
          (tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#27272a] bg-[#1c1c1c] px-3 py-1 text-[11px] text-zinc-500"
            >
              {tag}
            </span>
          )
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onSync}
        disabled={isSyncing}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-purple-900/25 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isSyncing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {isSyncing ? "Syncing Gmail…" : "Sync Gmail"}
      </button>
    </div>
  );
}
