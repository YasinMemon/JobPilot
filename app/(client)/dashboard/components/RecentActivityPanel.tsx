"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  Sparkles,
} from "lucide-react";
import { ActivityRow, ActivitySkeleton } from "./ActivityRow";
import type { RecentApplication } from "../types";
import type { ActivitySummary } from "../hooks/useDashboardActivity";
import { ROUTES } from "../constants";

interface RecentActivityPanelProps {
  recentApps: RecentApplication[];
  loading: boolean;
  activitySummary: ActivitySummary;
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function RecentActivityEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#161616] border border-[#27272a] mb-3">
        <Mail className="h-5 w-5 text-zinc-600" />
      </div>
      <p className="text-[13px] font-medium text-zinc-400">
        No applications yet
      </p>
      <p className="text-[11px] text-zinc-600 mt-1">
        Sync your Gmail to automatically track job applications.
      </p>
    </div>
  );
}

// ─── Footer Summary ───────────────────────────────────────────────────────────

interface ActivityFooterProps {
  summary: ActivitySummary;
}

function ActivityFooter({ summary }: ActivityFooterProps) {
  return (
    <div className="border-t border-[#27272a] px-5 py-3 flex items-center gap-4">
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        <span>{summary.sentCount} applied/offer</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
        <Clock className="h-3.5 w-3.5 text-amber-400" />
        <span>{summary.interviewCount} interview</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
        <span>{summary.pendingCount} pending</span>
      </div>
    </div>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

const SKELETON_COUNT = 4;

/**
 * Full "Recent Activity" card: header, rows (skeleton/empty/data), and footer summary.
 */
export function RecentActivityPanel({
  recentApps,
  loading,
  activitySummary,
}: RecentActivityPanelProps) {
  return (
    <div className="rounded-2xl border border-[#27272a] bg-[#111111]">
      {/* Header */}
      <div className="border-b border-[#27272a] px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-white">
            Recent Activity
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Your latest tracked applications
          </p>
        </div>
        <Link
          href={ROUTES.APPLICATIONS}
          className="flex items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#0f0f0f] px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition-all duration-200 hover:border-[#3f3f46] hover:text-zinc-200"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Rows */}
      <div className="px-5 py-2 divide-y divide-[#27272a]">
        {loading ? (
          <>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <ActivitySkeleton key={i} />
            ))}
          </>
        ) : recentApps.length === 0 ? (
          <RecentActivityEmptyState />
        ) : (
          recentApps.map((app) => (
            <ActivityRow
              key={app.id}
              company={app.company || "Unknown Company"}
              role={app.position || "Unknown Role"}
              date={app.date || app.receivedAt}
              status={app.status}
            />
          ))
        )}
      </div>

      {/* Footer summary */}
      {!loading && recentApps.length > 0 && (
        <ActivityFooter summary={activitySummary} />
      )}
    </div>
  );
}
