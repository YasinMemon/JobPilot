"use client";

import React, { useState, useEffect } from "react";
import {
  BriefcaseBusiness,
  Sparkles,
  Bell,
  Zap,
  Search,
  MapPin,
  TrendingUp,
} from "lucide-react";

// Animated feature pills
const FEATURES = [
  { icon: Search, label: "Smart Job Search" },
  { icon: MapPin, label: "Location Filters" },
  { icon: TrendingUp, label: "Trending Roles" },
  { icon: Zap, label: "One-Click Apply" },
  { icon: Sparkles, label: "AI Job Match" },
];

export default function JobsPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activePill, setActivePill] = useState(0);

  // Cycle through feature pills
  useEffect(() => {
    const id = setInterval(() => {
      setActivePill((p) => (p + 1) % FEATURES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden px-4 py-16">
      {/* Animated background blobs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full opacity-20 blur-3xl animate-blob"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full opacity-15 blur-3xl animate-blob animation-delay-2000"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-5 blur-3xl animate-blob animation-delay-4000"
        style={{ background: "radial-gradient(circle, #a78bfa, transparent 70%)" }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Icon badge */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-500/20 bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
          <BriefcaseBusiness className="h-9 w-9 text-indigo-400" />
        </div>

        {/* Status label */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-4">
          <Sparkles className="h-3 w-3" />
          Coming Soon
        </span>

        {/* Heading */}
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="gradient-text">Job Board</span>
          <br />
          <span className="text-foreground">is on its way</span>
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-sm mx-auto">
          We&apos;re building a powerful job discovery experience — tailored to your
          skills, preferences, and career goals. Stay tuned.
        </p>

        {/* Animated feature pills */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {FEATURES.map(({ icon: Icon, label }, i) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-500"
              style={{
                borderColor:
                  i === activePill
                    ? "rgba(99,102,241,0.4)"
                    : "rgba(39,39,42,0.8)",
                background:
                  i === activePill
                    ? "rgba(99,102,241,0.12)"
                    : "rgba(17,17,17,0.6)",
                color: i === activePill ? "#a5b4fc" : "#71717a",
                transform: i === activePill ? "scale(1.06)" : "scale(1)",
              }}
            >
              <Icon className="h-3 w-3" />
              {label}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Notify form */}
        {submitted ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
              <Bell className="h-5 w-5 text-indigo-400" />
            </div>
            <p className="text-sm font-semibold text-indigo-300">You&apos;re on the list!</p>
            <p className="text-xs text-muted-foreground">
              We&apos;ll notify you the moment Jobs goes live.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleNotify}
            className="flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full">
              <Bell className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-border bg-input pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all hover:bg-indigo-500 hover:shadow-[0_0_28px_rgba(99,102,241,0.5)] active:scale-95 w-full sm:w-auto justify-center"
            >
              <Bell className="h-4 w-4" />
              Notify Me
            </button>
          </form>
        )}

        {/* Progress shimmer bar */}
        <div className="mt-10">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
            <span>Feature development</span>
            <span className="text-indigo-400 font-medium">68%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full relative overflow-hidden"
              style={{
                width: "68%",
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              }}
            >
              <span className="absolute inset-0 shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
