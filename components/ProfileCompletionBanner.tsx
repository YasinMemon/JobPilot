"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, UserCircle2, X } from "lucide-react";
import { ProfileCompletionData } from "./ProfileCompletionModal";

interface ProfileCompletionBannerProps {
  data: ProfileCompletionData;
  onDismiss: () => void;
}

export default function ProfileCompletionBanner({
  data,
  onDismiss,
}: ProfileCompletionBannerProps) {
  const { completionPercentage, missingFields } = data;

  const barColor =
    completionPercentage >= 80
      ? "bg-emerald-500"
      : completionPercentage >= 50
        ? "bg-indigo-500"
        : "bg-amber-500";

  const labelColor =
    completionPercentage >= 80
      ? "text-emerald-400"
      : completionPercentage >= 50
        ? "text-indigo-400"
        : "text-amber-400";

  return (
    <div
      role="status"
      aria-label={`Profile ${completionPercentage}% complete. ${missingFields.length} fields missing.`}
      className="relative flex items-center gap-3 rounded-2xl border border-indigo-500/15 bg-indigo-500/5 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {/* Left accent bar */}
      <div className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />

      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
        <UserCircle2 className="h-4 w-4 text-indigo-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-[13px] font-semibold text-white">
            Profile{" "}
            <span className={labelColor}>{completionPercentage}% complete</span>
          </p>
          {missingFields.length > 0 && (
            <span className="text-[10px] text-zinc-600">
              · {missingFields.length} field{missingFields.length !== 1 ? "s" : ""} missing
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-[#27272a] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/dashboard/profile"
        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-medium text-indigo-300 transition-all duration-200 hover:bg-indigo-500/20 hover:text-indigo-200"
      >
        Complete
        <ArrowRight className="h-3 w-3" />
      </Link>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss profile reminder"
        className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
