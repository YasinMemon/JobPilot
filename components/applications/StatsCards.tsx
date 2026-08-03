"use client";

import { Briefcase, TrendingUp, Trophy, XCircle } from "lucide-react";
import { ApplicationStats } from "@/types/applications/type";

interface StatsCardsProps {
  stats?: ApplicationStats;
  loading?: boolean;
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  const statItems = [
    {
      id: "total",
      label: "Applications",
      value: stats?.total ?? 0,
      icon: Briefcase,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      gradient: "from-blue-500/5 to-blue-600/0",
      border: "hover:border-blue-500/30",
      glow: "hover:shadow-blue-900/20",
    },
    {
      id: "interviews",
      label: "Interviews",
      value: stats?.interview ?? 0,
      icon: TrendingUp,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      gradient: "from-amber-500/5 to-amber-600/0",
      border: "hover:border-amber-500/30",
      glow: "hover:shadow-amber-900/20",
    },
    {
      id: "offers",
      label: "Offers",
      value: stats?.offer ?? 0,
      icon: Trophy,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      gradient: "from-emerald-500/5 to-emerald-600/0",
      border: "hover:border-emerald-500/30",
      glow: "hover:shadow-emerald-900/20",
    },
    {
      id: "rejected",
      label: "Rejected",
      value: stats?.rejected ?? 0,
      icon: XCircle,
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
      gradient: "from-rose-500/5 to-rose-600/0",
      border: "hover:border-rose-500/30",
      glow: "hover:shadow-rose-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {statItems.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className={`group relative overflow-hidden rounded-2xl border border-[#27272a] bg-[#111111] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${stat.border} ${stat.glow}`}
          >
            {/* Background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />

            {/* Content */}
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>

              <p
                className={`text-3xl font-bold tracking-tight text-white tabular-nums transition-all duration-300 ${
                  loading ? "opacity-40 animate-pulse" : ""
                }`}
              >
                {stat.value.toLocaleString()}
              </p>
              <p className="mt-1.5 text-xs font-medium text-zinc-500">
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
