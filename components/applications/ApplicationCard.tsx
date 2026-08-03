"use client";

import { Mail, MapPin, ArrowRight, Calendar } from "lucide-react";
import { Application, ApplicationStatus } from "@/types/applications/type";

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config: Record<
    ApplicationStatus,
    { label: string; className: string }
  > = {
    [ApplicationStatus.APPLIED]: {
      label: "Applied",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    [ApplicationStatus.VIEWED]: {
      label: "Viewed",
      className: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    },
    [ApplicationStatus.INTERVIEW]: {
      label: "Interview",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    [ApplicationStatus.ASSESSMENT]: {
      label: "Assessment",
      className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    },
    [ApplicationStatus.SHORTLISTED]: {
      label: "Shortlisted",
      className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    },
    [ApplicationStatus.OFFER]: {
      label: "Offer",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    [ApplicationStatus.REJECTED]: {
      label: "Rejected",
      className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    [ApplicationStatus.HIRED]: {
      label: "Hired",
      className: "bg-green-500/10 text-green-400 border-green-500/20",
    },
    [ApplicationStatus.UNKNOWN]: {
      label: "Unknown",
      className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    },
  };

  const { label, className } = config[status] ?? config[ApplicationStatus.UNKNOWN];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

// ── Company avatar ────────────────────────────────────────────────────────────
function CompanyAvatar({ company }: { company: string }) {
  // Generate a consistent gradient based on the first character
  const gradients: Record<string, string> = {
    Google: "from-red-500 to-yellow-500",
    Amazon: "from-orange-400 to-amber-500",
    Stripe: "from-blue-500 to-indigo-600",
    Notion: "from-zinc-600 to-zinc-800",
    Vercel: "from-zinc-800 to-zinc-950",
    Linear: "from-violet-500 to-purple-700",
    OpenAI: "from-teal-500 to-emerald-600",
    Figma: "from-pink-500 to-rose-600",
    Microsoft: "from-blue-600 to-cyan-500",
    Apple: "from-zinc-700 to-zinc-900",
    Meta: "from-blue-500 to-blue-700",
    Netflix: "from-red-600 to-red-800",
  };

  const gradient =
    gradients[company] ?? "from-blue-500 to-purple-600";

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow-lg`}
    >
      {company ? company[0].toUpperCase() : "?"}
    </div>
  );
}

// ── Application card ──────────────────────────────────────────────────────────
interface ApplicationCardProps {
  application: Application;
  onViewDetails: (application: Application) => void;
}

export default function ApplicationCard({
  application,
  onViewDetails,
}: ApplicationCardProps) {
  return (
    <div className="group relative rounded-2xl border border-[#27272a] bg-[#111111] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#3f3f46] hover:shadow-xl hover:shadow-black/40">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CompanyAvatar company={application.company} />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-white truncate">
              {application.company || "Unknown Company"}
            </p>
            <p className="text-[12px] text-zinc-400 truncate">
              {application.position || "Unknown Position"}
            </p>
          </div>
        </div>
        <StatusBadge status={application.status} />
      </div>

      {/* Meta row */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 min-w-0">
          <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
          {/* `email` is the serialized `from` field */}
          <span className="truncate">{application.email}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 min-w-0">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
          <span className="truncate">{application.location || "Location unknown"}</span>
        </div>
      </div>

      {/* Subject */}
      <div className="mt-3 rounded-lg border border-[#1c1c1c] bg-[#0f0f0f] px-3 py-2.5">
        <p className="text-[11px] font-medium text-zinc-400 mb-0.5 truncate">
          {application.subject}
        </p>
        <p className="text-[11px] text-zinc-600 truncate leading-relaxed">
          {application.snippet}
        </p>
      </div>

      {/* Bottom row */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
          <Calendar className="h-3 w-3" />
          {/* `date` is the serialized relative date string */}
          <span>{application.date}</span>
        </div>
        <button
          onClick={() => onViewDetails(application)}
          className="flex items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#1c1c1c] px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-400 group/btn"
        >
          View Details
          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
