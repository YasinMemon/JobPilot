"use client";

import { Briefcase, RefreshCw, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApplicationsHeaderProps {
  onRefresh?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  syncMessage?: string;
}

export default function ApplicationsHeader({
  onRefresh,
  onSync,
  isSyncing = false,
  syncMessage,
}: ApplicationsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left — title */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/20">
          <Briefcase className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Applications
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {syncMessage ? (
              <span className="text-emerald-400">{syncMessage}</span>
            ) : (
              "Track all your job applications in one place."
            )}
          </p>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#27272a] bg-[#111111] text-zinc-500 transition-all duration-200 hover:border-[#3f3f46] hover:text-zinc-200"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
        </button>

        {/* Sync Gmail button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={isSyncing}
          className="gap-1.5 rounded-xl border-[#27272a] bg-[#111111] text-zinc-400 hover:border-[#3f3f46] hover:text-zinc-200 hover:bg-[#1c1c1c] text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
          />
          {isSyncing ? "Syncing…" : "Sync Gmail"}
        </Button>

        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition-transform duration-200 hover:scale-105">
          Y
        </button>
      </div>
    </div>
  );
}
