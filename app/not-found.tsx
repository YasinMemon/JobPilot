"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#3b82f620,transparent_60%),radial-gradient(circle_at_bottom,#ec489920,transparent_60%)]" />

      {/* Floating Blobs */}
      <div className="absolute left-20 top-20 h-72 w-72 animate-pulse rounded-full bg-purple-600/30 blur-[120px]" />
      <div className="absolute bottom-20 right-20 h-72 w-72 animate-pulse rounded-full bg-cyan-500/30 blur-[120px]" />

      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-size-[50px_50px]" />

      <div className="relative z-10 flex max-w-2xl flex-col items-center px-6 text-center">
        {/* 404 */}
        <h1 className="animate-pulse text-[140px] font-black leading-none tracking-tight text-transparent bg-linear-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text drop-shadow-[0_0_40px_rgba(168,85,247,0.7)] md:text-[220px]">
          404
        </h1>

        {/* Glitch */}
        <div className="relative mb-6">
          <h2 className="text-4xl font-extrabold uppercase md:text-6xl">
            Lost in Space
          </h2>

          <span className="absolute left-1 top-0 animate-pulse text-4xl font-extrabold uppercase text-cyan-400 opacity-40 blur-[1px] md:text-6xl">
            Lost in Space
          </span>

          <span className="absolute -left-1 top-0 animate-pulse text-4xl font-extrabold uppercase text-pink-500 opacity-40 blur-[1px] md:text-6xl">
            Lost in Space
          </span>
        </div>

        <p className="max-w-lg text-lg text-gray-300">
          The page you&apos;re looking for has escaped into another dimension. Maybe
          it was abducted by aliens... 👽
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            href="/"
            className="rounded-xl bg-linear-to-r from-cyan-500 via-blue-600 to-purple-600 px-8 py-4 font-semibold shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(168,85,247,0.7)]"
          >
            🚀 Return Home
          </Link>

          <button
            onClick={() => history.back()}
            className="rounded-xl border border-white/20 bg-white/5 px-8 py-4 font-semibold backdrop-blur-xl transition hover:bg-white/10"
          >
            ← Go Back
          </button>
        </div>

        <div className="mt-16 text-sm uppercase tracking-[8px] text-white/40">
          ERROR • PAGE • NOT • FOUND
        </div>
      </div>
    </main>
  );
}
