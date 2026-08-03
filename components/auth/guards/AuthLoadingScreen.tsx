"use client";

/**
 * AuthLoadingScreen
 *
 * Full-screen loading state displayed while session verification is in-progress.
 * Prevents flash-of-unauthenticated-content (FOUC) on page load and refresh.
 *
 * Used by ProtectedRoute and PublicRoute guards.
 */

import { Zap } from "lucide-react";

export function AuthLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a]">
      {/* Ambient gradient blobs */}
      <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="relative flex flex-col items-center gap-5">
        {/* Animated logo mark */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl shadow-purple-900/40">
          <Zap className="h-7 w-7 text-white" strokeWidth={2.5} />
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-2xl animate-ping bg-gradient-to-br from-blue-500/30 to-purple-600/30" />
        </div>

        {/* Brand */}
        <div className="text-center">
          <p className="text-[18px] font-bold tracking-tight text-white">
            Job<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Pilot</span>
          </p>
          <p className="mt-1 text-[12px] font-medium text-zinc-500 tracking-wide">
            Verifying session…
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-40 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-full origin-left animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
