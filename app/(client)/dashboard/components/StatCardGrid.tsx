"use client";

import React from "react";
import { StatCard } from "./StatCard";
import { STAT_CARDS_CONFIG } from "../constants";
import type { DashboardStats } from "../types";

interface StatCardGridProps {
  stats: DashboardStats | null;
  loading: boolean;
}

/**
 * Renders the grid of four stat cards using the config-driven STAT_CARDS_CONFIG.
 * Adding a new stat card only requires extending the constant — no JSX change needed.
 */
export const StatCardGrid = React.memo(function StatCardGrid({
  stats,
  loading,
}: StatCardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STAT_CARDS_CONFIG.map((config) => (
        <StatCard
          key={config.key}
          icon={config.icon}
          label={config.label}
          value={loading ? "—" : config.getValue(stats)}
          trend={config.getTrend(stats)}
          trendUp={config.isTrendUp(stats)}
          iconBg={config.iconBg}
          iconColor={config.iconColor}
          loading={loading}
        />
      ))}
    </div>
  );
});
