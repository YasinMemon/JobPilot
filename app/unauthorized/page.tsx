"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
      {/* Ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ef444420,transparent_60%),radial-gradient(circle_at_bottom,#7c3aed20,transparent_60%)]" />

      {/* Floating blobs */}
      <div className="absolute left-20 top-20 h-72 w-72 animate-pulse rounded-full bg-red-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-20 h-72 w-72 animate-pulse rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 flex max-w-2xl flex-col items-center px-6 text-center">
        {/* 403 number */}
        <h1 className="text-[140px] font-black leading-none tracking-tight text-transparent bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text drop-shadow-[0_0_40px_rgba(239,68,68,0.5)] md:text-[220px]">
          403
        </h1>

        {/* Shield icon */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
          <ShieldX className="h-8 w-8 text-red-400" />
        </div>

        {/* Heading with glitch layers */}
        <div className="relative mb-4">
          <h2 className="text-4xl font-extrabold uppercase md:text-5xl">
            Access Denied
          </h2>
          <span className="absolute left-0.5 top-0 text-4xl font-extrabold uppercase text-red-400 opacity-30 blur-[1px] md:text-5xl pointer-events-none select-none">
            Access Denied
          </span>
          <span className="absolute -left-0.5 top-0 text-4xl font-extrabold uppercase text-orange-400 opacity-30 blur-[1px] md:text-5xl pointer-events-none select-none">
            Access Denied
          </span>
        </div>

        <p className="max-w-md text-base text-gray-400">
          You don&apos;t have permission to access this page. If you believe
          this is an error, please contact your administrator.
        </p>

        {/* Actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 px-8 py-3.5 text-sm font-semibold shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(168,85,247,0.5)]"
          >
            🚀 Go to Dashboard
          </Link>

          <button
            onClick={() => history.back()}
            className="rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold backdrop-blur-xl transition hover:bg-white/10"
          >
            ← Go Back
          </button>
        </div>

        <div className="mt-16 text-xs uppercase tracking-[8px] text-white/30">
          ERROR • FORBIDDEN • 403
        </div>
      </div>
    </main>
  );
}
