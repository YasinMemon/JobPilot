"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { useGoogleStatus } from "../hooks/useGoogleStatus";
import { ROUTES } from "../constants";

/**
 * Renders a dismissible amber warning banner when the user's Google account
 * is not connected. Returns null while loading or when already connected.
 */
export function GoogleStatusBanner() {
  const { connected, dismissed, dismiss } = useGoogleStatus();

  // Hide if connected, dismissed, or still loading
  if (connected !== false || dismissed) return null;

  return (
    <div className="relative flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Left accent */}
      <div className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-amber-400" />

      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-amber-300">
          Gmail is not connected
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Connect your Google account to enable{" "}
          <span className="text-zinc-400">Send Email</span>,{" "}
          <span className="text-zinc-400">Application Sync</span>, and{" "}
          <span className="text-zinc-400">AI Email Tracking</span>.
        </p>
      </div>

      <Link
        href={ROUTES.SETTINGS_CONNECTED_ACCOUNTS}
        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-300 transition-all duration-200 hover:bg-amber-500/20 hover:text-amber-200"
      >
        Connect Google
        <ArrowRight className="h-3 w-3" />
      </Link>

      <button
        aria-label="Dismiss"
        onClick={dismiss}
        className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
