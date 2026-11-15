"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowRight,
  CheckCircle2,
  Circle,
  UserCircle2,
  FileText,
  MapPin,
  Phone,
  Zap,
  GraduationCap,
  Briefcase,
  Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProfileCompletionData {
  profileCompleted: boolean;
  completionPercentage: number;
  missingFields: string[];
}

interface ProfileCompletionModalProps {
  data: ProfileCompletionData;
  onDismiss: () => void;
}

// ─── Field Icon Map ───────────────────────────────────────────────────────────
const FIELD_ICONS: Record<string, React.ElementType> = {
  "Full Name": UserCircle2,
  "Phone Number": Phone,
  Location: MapPin,
  Resume: FileText,
  Skills: Zap,
  Experience: Clock,
  Education: GraduationCap,
  "Preferred Job Role": Briefcase,
};

// ─── Circular Progress Ring ───────────────────────────────────────────────────
function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 80
      ? "#10b981"
      : percentage >= 50
        ? "#6366f1"
        : "#f59e0b";

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-30"
        style={{ background: color }}
      />
      <svg
        width="128"
        height="128"
        viewBox="0 0 128 128"
        aria-hidden="true"
        className="relative -rotate-90"
      >
        {/* Track */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color }}
        >
          {percentage}%
        </span>
        <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
          Complete
        </span>
      </div>
    </div>
  );
}

// ─── Career Illustration SVG ──────────────────────────────────────────────────
function CareerIllustration() {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="40" cy="40" r="38" fill="#1c1c1c" stroke="#27272a" strokeWidth="1" />
      {/* Person body */}
      <circle cx="40" cy="30" r="11" fill="#6366f1" opacity="0.9" />
      <ellipse cx="40" cy="56" rx="16" ry="11" fill="#6366f1" opacity="0.7" />
      {/* Sparkles */}
      <circle cx="60" cy="18" r="2.5" fill="#a78bfa" />
      <circle cx="65" cy="28" r="1.5" fill="#8b5cf6" />
      <circle cx="55" cy="13" r="1.5" fill="#c4b5fd" />
      {/* Checkmark badge */}
      <circle cx="55" cy="48" r="10" fill="#10b981" />
      <path d="M50.5 48.5l3.5 3.5 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function ProfileCompletionModal({
  data,
  onDismiss,
}: ProfileCompletionModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const dismissBtnRef = useRef<HTMLButtonElement>(null);

  const { completionPercentage, missingFields } = data;

  // Focus the dismiss button when modal mounts
  useEffect(() => {
    dismissBtnRef.current?.focus();
  }, []);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
      // Trap focus within the modal
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'a, button, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onDismiss],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleCompleteProfile = () => {
    onDismiss();
    router.push("/dashboard/profile");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
        aria-hidden="true"
        onClick={onDismiss}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        aria-describedby="profile-modal-desc"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <div
          className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md animate-in fade-in zoom-in-95 duration-300 rounded-3xl border border-[#2e2e32] bg-[#111111] shadow-2xl shadow-black/60 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top gradient accent */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-600/10 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            ref={dismissBtnRef}
            onClick={onDismiss}
            aria-label="Remind me later and close"
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-6 pt-8 pb-6">
            {/* Header row: illustration + progress */}
            <div className="flex items-center gap-5 mb-6">
              <div className="h-20 w-20 shrink-0">
                <CareerIllustration />
              </div>

              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-medium text-indigo-300 uppercase tracking-wider">
                    Profile Setup
                  </span>
                </div>
                <h2
                  id="profile-modal-title"
                  className="text-lg font-bold text-white leading-snug"
                >
                  Complete Your Profile
                </h2>
                <p
                  id="profile-modal-desc"
                  className="mt-1 text-[12px] text-zinc-500 leading-relaxed"
                >
                  Unlock personalized job recommendations, better resume matching,
                  and higher hiring chances.
                </p>
              </div>
            </div>

            {/* Progress ring */}
            <div className="flex items-center justify-center mb-6">
              <CircularProgress percentage={completionPercentage} />
            </div>

            {/* Missing fields */}
            {missingFields.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Missing Information
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {missingFields.map((field) => {
                    const Icon = FIELD_ICONS[field] ?? Circle;
                    return (
                      <div
                        key={field}
                        className="flex items-center gap-2 rounded-xl border border-[#27272a] bg-[#0f0f0f] px-3 py-2.5"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">
                          <Icon className="h-3.5 w-3.5 text-rose-400" />
                        </div>
                        <span className="text-[12px] text-zinc-400 leading-tight">
                          {field}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleCompleteProfile}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-[14px] font-semibold text-white transition-all duration-300 hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-purple-900/30 hover:scale-[1.01] active:scale-[0.99]"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete Profile
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                {/* Shimmer */}
                <span className="absolute inset-0 -skew-x-12 bg-white/0 group-hover:bg-white/5 transition-all duration-500" />
              </button>

              <button
                onClick={onDismiss}
                className="w-full rounded-xl border border-[#27272a] bg-transparent px-5 py-2.5 text-[13px] font-medium text-zinc-500 transition-all duration-200 hover:border-[#3f3f46] hover:text-zinc-300"
              >
                Remind Me Later
              </button>
            </div>
          </div>

          {/* Bottom gradient */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#27272a] to-transparent" />
        </div>
      </div>
    </>
  );
}
