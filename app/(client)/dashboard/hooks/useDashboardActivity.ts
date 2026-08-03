"use client";

import { useMemo } from "react";
import { useApplicationStats } from "@/app/hooks/useApplicationStats";
import { useApplications } from "@/app/hooks/useApplications";
import type { DashboardStats, RecentApplication } from "../types";
import {
  RECENT_APPS_LIMIT,
  RECENT_APPS_SORT_BY,
  RECENT_APPS_SORT_ORDER,
} from "../constants";

export interface ActivitySummary {
  sentCount: number;
  interviewCount: number;
  pendingCount: number;
}

export interface UseDashboardActivityReturn {
  stats: DashboardStats | null;
  statsLoading: boolean;
  recentApps: RecentApplication[];
  recentLoading: boolean;
  activitySummary: ActivitySummary;
}

const RECENT_APPS_FILTER = {
  limit: RECENT_APPS_LIMIT,
  sortBy: RECENT_APPS_SORT_BY,
  sortOrder: RECENT_APPS_SORT_ORDER,
} as const;

/**
 * Aggregates stats and recent applications data for the dashboard.
 * Wraps the existing React Query hooks for caching and deduplication.
 */
export function useDashboardActivity(): UseDashboardActivityReturn {
  const statsQuery = useApplicationStats();
  const recentQuery = useApplications(RECENT_APPS_FILTER);

  const stats = statsQuery.data?.data ?? null;
  const statsLoading = statsQuery.isLoading;

  const recentApps: RecentApplication[] = recentQuery.data?.data ?? [];
  const recentLoading = recentQuery.isLoading;

  const activitySummary = useMemo<ActivitySummary>(
    () => ({
      sentCount: recentApps.filter(
        (a) =>
          a.status === "Applied" ||
          a.status === "Offer" ||
          a.status === "Hired",
      ).length,
      interviewCount: recentApps.filter((a) => a.status === "Interview").length,
      pendingCount: recentApps.filter(
        (a) =>
          a.status === "Assessment" ||
          a.status === "Shortlisted" ||
          a.status === "Viewed",
      ).length,
    }),
    [recentApps],
  );

  return { stats, statsLoading, recentApps, recentLoading, activitySummary };
}
