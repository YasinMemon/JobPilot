"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useActivities } from "../hooks/useActivities";
import type { IActivity, AIActivityType } from "@/types/ai";

// ─── Activity dot colors ──────────────────────────────────────────────────────

const ACTIVITY_DOT_COLORS: Record<AIActivityType, string> = {
  resume: "bg-blue-400",
  ats: "bg-sky-400",
  interview: "bg-purple-400",
  jd: "bg-emerald-400",
  cover_letter: "bg-amber-400",
  recruiter_message: "bg-rose-400",
  salary: "bg-cyan-400",
  roadmap: "bg-violet-400",
  skill_gap: "bg-indigo-400",
  company: "bg-teal-400",
  chat: "bg-zinc-400",
};

const ACTIVITY_LABELS: Record<AIActivityType, string> = {
  resume: "Resume analyzed",
  ats: "ATS score calculated",
  interview: "Interview completed",
  jd: "JD analyzed",
  cover_letter: "Cover letter created",
  recruiter_message: "Recruiter message generated",
  salary: "Salary insights generated",
  roadmap: "Career roadmap created",
  skill_gap: "Skill gap analysis done",
  company: "Company research done",
  chat: "Chat session",
};

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const diff = now - new Date(isoString).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(isoString).toLocaleDateString();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ActivitySkeleton() {
  return (
    <div className="px-4 py-3 space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-[#27272a] shrink-0 mt-1.5" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[#27272a] rounded w-3/4" />
            <div className="h-2.5 bg-[#1f1f1f] rounded w-full" />
            <div className="h-2 bg-[#1a1a1a] rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityTimeline() {
  const { data: activities, isLoading, error } = useActivities();

  return (
    <div className="rounded-2xl border border-[#27272a] bg-[#111111] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#27272a] px-4 py-3.5 flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-purple-400" />
        <span className="text-[12px] font-semibold text-white">Recent AI Activities</span>
      </div>

      {/* Content */}
      {isLoading ? (
        <ActivitySkeleton />
      ) : error ? (
        <div className="px-4 py-6 text-center text-[11px] text-zinc-600">
          Failed to load activities
        </div>
      ) : !activities || activities.length === 0 ? (
        <div className="px-4 py-6 text-center text-[11px] text-zinc-600">
          No activities yet. Use an AI tool to get started!
        </div>
      ) : (
        <div className="px-4 py-3 space-y-0">
          {activities.map((activity: IActivity, i: number) => {
            const dotColor = ACTIVITY_DOT_COLORS[activity.type] || "bg-zinc-400";
            const label = ACTIVITY_LABELS[activity.type] || activity.title;

            return (
              <motion.div
                key={activity._id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className="flex gap-3 relative"
              >
                {/* Timeline line */}
                {i < activities.length - 1 && (
                  <div className="absolute left-[5px] top-5 bottom-0 w-px bg-[#27272a]" />
                )}

                {/* Dot */}
                <div className="relative mt-1.5 shrink-0">
                  <span className={`block h-2.5 w-2.5 rounded-full ${dotColor} shadow-sm`} />
                </div>

                {/* Content */}
                <div className="pb-4 min-w-0">
                  <p className="text-[12px] font-medium text-zinc-300 leading-tight">
                    {label}
                  </p>
                  <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                    {activity.description}
                  </p>
                  <p className="text-[10px] text-zinc-700 mt-1">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
