"use client";

// Reusable shimmer pulse block
function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={`rounded-lg bg-[#1c1c1c] animate-pulse ${className}`}
    />
  );
}

// ── Stats skeleton ────────────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#27272a] bg-[#111111] p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Shimmer className="h-10 w-10 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Shimmer className="h-8 w-16" />
        <Shimmer className="h-3 w-24" />
      </div>
    </div>
  );
}

// ── Card skeleton ─────────────────────────────────────────────────────────────
function ApplicationCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#27272a] bg-[#111111] p-5 space-y-4">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shimmer className="h-11 w-11 rounded-xl" />
          <div className="space-y-2">
            <Shimmer className="h-4 w-28" />
            <Shimmer className="h-3 w-20" />
          </div>
        </div>
        <Shimmer className="h-5 w-16 rounded-full" />
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-2">
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-full" />
      </div>

      {/* Subject box */}
      <div className="rounded-lg border border-[#1c1c1c] bg-[#0f0f0f] p-3 space-y-2">
        <Shimmer className="h-3 w-3/4" />
        <Shimmer className="h-3 w-full" />
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-7 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// ── Search bar skeleton ───────────────────────────────────────────────────────
function SearchBarSkeleton() {
  return (
    <div className="flex gap-3">
      <Shimmer className="h-10 flex-1 rounded-xl" />
      <Shimmer className="h-10 w-36 rounded-xl" />
      <Shimmer className="h-10 w-32 rounded-xl" />
    </div>
  );
}

// ── Main skeleton export ──────────────────────────────────────────────────────
export default function ApplicationsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Search */}
      <SearchBarSkeleton />

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ApplicationCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
