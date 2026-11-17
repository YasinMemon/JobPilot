"use client";

import { AlertTriangle, BellOff, RefreshCw } from "lucide-react";

export function NotificationSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul aria-busy="true" aria-label="Loading notifications">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="flex animate-pulse items-start gap-3 border-b border-[#1f1f23] px-4 py-4 last:border-b-0"
        >
          <span className="h-9 w-9 shrink-0 rounded-xl bg-[#1c1c1f]" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-2/5 rounded bg-[#1c1c1f]" />
            <span className="block h-3 w-4/5 rounded bg-[#18181b]" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function NotificationEmpty({ unreadOnly }: { unreadOnly?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#27272a] bg-[#111111] text-zinc-500">
        <BellOff className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-zinc-200">
        {unreadOnly ? "You're all caught up" : "No notifications yet"}
      </p>
      <p className="mt-1 max-w-xs text-xs text-zinc-500">
        {unreadOnly
          ? "You have no unread notifications."
          : "Application updates, interview reminders and account alerts will show up here."}
      </p>
    </div>
  );
}

export function NotificationError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center px-6 py-12 text-center"
    >
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-zinc-200">
        Couldn&apos;t load notifications
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#27272a] bg-[#111111] px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-[#3f3f46] hover:text-white"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}
