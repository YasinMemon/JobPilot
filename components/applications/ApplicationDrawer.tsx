"use client";

import { useEffect, useState } from "react";
import {
  X,
  Mail,
  MapPin,
  Calendar,
  Paperclip,
  Sparkles,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Loader2,
  CalendarClock,
  MailQuestionMark,
} from "lucide-react";
import { Application, ApplicationStatus } from "@/types/applications/type";
import { useUpdateStatus } from "@/app/hooks/useUpdateStatus";
import { useUpdateApplication } from "@/app/hooks/useUpdateApplication";
import { useApplicationFollowUps } from "@/app/hooks/useFollowUps";
import { FollowUpCard } from "@/components/follow-ups/FollowUpCard";
import { FollowUpComposer } from "@/components/follow-ups/FollowUpComposer";
import type { SerializedTrackedEmail } from "@/types/followups/type";

// ── Smart follow-ups for this application ───────────────────────────────────
function FollowUpSection({ applicationId }: { applicationId: string }) {
  const { data, isPending, isError, refetch } = useApplicationFollowUps(applicationId);
  const [composer, setComposer] = useState<SerializedTrackedEmail | null>(null);
  const items = data?.data ?? [];

  return (
    <div className="border-b border-[#27272a] px-5 py-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/10">
          <MailQuestionMark className="h-3.5 w-3.5 text-orange-400" />
        </div>
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-white">
          Smart Follow-up
        </h3>
      </div>

      {isPending ? (
        <div className="h-24 animate-pulse rounded-2xl border border-[#27272a] bg-[#0f0f10]" aria-busy="true" />
      ) : isError ? (
        <p className="text-[12px] text-zinc-500">
          Could not load follow-ups.{" "}
          <button type="button" onClick={() => refetch()} className="text-blue-400 hover:text-blue-300">
            Retry
          </button>
        </p>
      ) : items.length === 0 ? (
        <p className="text-[12px] leading-relaxed text-zinc-500">
          No tracked email for this application. Emails sent through JobPilot are tracked
          automatically, and you will be reminded after 10 days without a reply.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((e) => (
            <FollowUpCard key={e.id} email={e} onOpenComposer={setComposer} />
          ))}
        </ul>
      )}

      {composer && (
        <FollowUpComposer key={composer.id} email={composer} onClose={() => setComposer(null)} />
      )}
    </div>
  );
}

// ── Status badge (inline) ─────────────────────────────────────────────────────
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

  const { label, className } =
    config[status] ?? config[ApplicationStatus.UNKNOWN];
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
  const gradient = gradients[company] ?? "from-blue-500 to-purple-600";
  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-xl font-bold text-white shadow-lg`}
    >
      {company ? company[0].toUpperCase() : "?"}
    </div>
  );
}

// ── Attachment icon ───────────────────────────────────────────────────────────
function AttachmentIcon({ type }: { type: string }) {
  if (type === "xlsx" || type === "xls" || type === "csv")
    return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
  return <FileText className="h-4 w-4 text-blue-400" />;
}

// ── Interview scheduler ───────────────────────────────────────────────────────
/** ISO string → value accepted by <input type="datetime-local"> (local time). */
function toLocalInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function InterviewSection({ application }: { application: Application }) {
  const { mutate, isPending } = useUpdateApplication();
  const [value, setValue] = useState(toLocalInputValue(application.interviewAt));
  const [error, setError] = useState<string | null>(null);
  // The drawer receives a snapshot of the application, so track what was saved.
  const [saved, setSaved] = useState<string | null>(application.interviewAt ?? null);

  const save = (next: string) => {
    setError(null);
    const iso = next ? new Date(next).toISOString() : null;
    mutate(
      { id: application.id, data: { interviewAt: iso } },
      {
        onSuccess: () => setSaved(iso),
        onError: () => setError("Couldn't save the interview time."),
      },
    );
  };

  return (
    <div className="border-b border-[#27272a] px-5 py-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-3.5 w-3.5 text-zinc-600" />
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-white">
          Interview
        </h3>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Interview date and time"
          className="min-w-0 flex-1 rounded-xl border border-[#27272a] bg-[#111111] px-3 py-2 text-[12px] text-zinc-200 [color-scheme:dark] focus:border-blue-500/40 focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => save(value)}
            disabled={isPending || !value}
            className="flex-1 rounded-xl border border-[#27272a] bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-2 text-[12px] font-semibold text-white transition-all hover:from-blue-500/30 hover:to-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          {saved && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                save("");
              }}
              disabled={isPending}
              className="rounded-xl border border-[#27272a] px-3 py-2 text-[12px] text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-zinc-600">
        You&apos;ll get a notification now and reminders before the interview.
      </p>
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────
interface ApplicationDrawerProps {
  application: Application | null;
  onClose: () => void;
}

const ALL_STATUSES = Object.values(ApplicationStatus);

export default function ApplicationDrawer({
  application,
  onClose,
}: ApplicationDrawerProps) {
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateStatus();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (application) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [application]);

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    if (!application || newStatus === application.status) return;
    updateStatus({ id: application.id, status: newStatus });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          application ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-[#0f0f0f] border-l border-[#27272a] shadow-2xl transition-transform duration-300 ease-in-out ${
          application ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {application && (
          <>
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-[#27272a] px-5 py-4">
              <div className="flex items-center gap-3">
                <CompanyAvatar company={application.company} />
                <div>
                  <p className="text-[15px] font-bold text-white">
                    {application.company || "Unknown Company"}
                  </p>
                  <p className="text-[12px] text-zinc-400">
                    {application.position || "Unknown Position"}
                  </p>
                  <div className="mt-1.5">
                    <StatusBadge status={application.status} />
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#27272a] bg-[#111111] text-zinc-500 transition-all hover:border-[#3f3f46] hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">
              {/* Meta info */}
              <div className="border-b border-[#27272a] px-5 py-4 space-y-2.5">
                <div className="flex items-center gap-2 text-[12px] text-zinc-500">
                  <Mail className="h-3.5 w-3.5 text-zinc-600" />
                  {/* `email` is the serialized `from` field */}
                  <span className="text-zinc-400">{application.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-zinc-500">
                  <MapPin className="h-3.5 w-3.5 text-zinc-600" />
                  <span>{application.location || "Location not specified"}</span>
                </div>
                {application.salary && (
                  <div className="flex items-center gap-2 text-[12px] text-zinc-500">
                    <span className="text-zinc-600">💰</span>
                    <span>{application.salary}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[12px] text-zinc-500">
                  <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                  {/* `date` is the serialized relative date string */}
                  <span>{application.date}</span>
                </div>
                {application.platform && (
                  <div className="flex items-center gap-2 text-[12px] text-zinc-500">
                    <span className="text-zinc-600">🔗</span>
                    <span className="text-zinc-400">{application.platform}</span>
                  </div>
                )}
              </div>

              <InterviewSection key={application.id} application={application} />

              <FollowUpSection key={`fu-${application.id}`} applicationId={application.id} />

              {/* AI Summary */}
              <div className="border-b border-[#27272a] px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <h3 className="text-[12px] font-semibold text-white uppercase tracking-wide">
                    AI Summary
                  </h3>
                  <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-medium text-blue-400 uppercase tracking-wide">
                    Beta
                  </span>
                </div>
                <p className="text-[12px] text-zinc-400 leading-relaxed">
                  {application.aiSummary || "No AI summary available for this application."}
                </p>
              </div>

              {/* Email thread */}
              <div className="border-b border-[#27272a] px-5 py-4">
                <h3 className="text-[12px] font-semibold text-white uppercase tracking-wide mb-3">
                  Email Thread
                </h3>
                {/* Subject */}
                <p className="text-[12px] font-medium text-zinc-300 mb-3">
                  {application.subject}
                </p>
                {/* Full email — `fullEmailContent` is the serialized `fullEmail` */}
                <div className="rounded-xl border border-[#27272a] bg-[#111111] px-4 py-3">
                  <pre className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
                    {application.fullEmailContent || "No email content available."}
                  </pre>
                </div>
              </div>

              {/* Attachments */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="h-3.5 w-3.5 text-zinc-600" />
                  <h3 className="text-[12px] font-semibold text-white uppercase tracking-wide">
                    Attachments
                  </h3>
                  <span className="rounded-full border border-[#27272a] bg-[#1c1c1c] px-2 py-0.5 text-[9px] text-zinc-500">
                    {application.attachments.length}
                  </span>
                </div>
                {application.attachments.length === 0 ? (
                  <p className="text-[11px] text-zinc-600">
                    No attachments for this application.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {application.attachments.map((att, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-[#27272a] bg-[#111111] px-3 py-2.5 transition-all hover:border-[#3f3f46]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AttachmentIcon type={att.type} />
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-zinc-300 truncate">
                              {att.name}
                            </p>
                            <p className="text-[10px] text-zinc-600">
                              {att.size}
                            </p>
                          </div>
                        </div>
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer footer — status updater + close */}
            <div className="border-t border-[#27272a] px-5 py-3 flex items-center gap-2">
              {/* Status update select */}
              <div className="relative flex-1">
                <select
                  value={application.status}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as ApplicationStatus)
                  }
                  disabled={isUpdatingStatus}
                  className="w-full appearance-none rounded-xl border border-[#27272a] bg-gradient-to-r from-blue-600/10 to-purple-600/10 px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:from-blue-500/20 hover:to-purple-500/20 focus:outline-none focus:border-blue-500/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-[#111111] font-normal">
                      {s}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {isUpdatingStatus ? (
                    <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />
                  ) : (
                    <svg className="h-3 w-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </span>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl border border-[#27272a] bg-[#1c1c1c] px-4 py-2.5 text-[13px] font-medium text-zinc-400 transition-all hover:border-[#3f3f46] hover:text-zinc-200"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
