"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MailCheck,
  MailQuestionMark,
  RefreshCw,
} from "lucide-react";
import { useFollowUps } from "@/app/hooks/useFollowUps";
import type { SerializedTrackedEmail } from "@/types/followups/type";
import { FollowUpComposer } from "@/components/follow-ups/FollowUpComposer";
import { FollowUpCard } from "@/components/follow-ups/FollowUpCard";

type Filter = "action" | "waiting" | "done" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "action", label: "Needs action" },
  { key: "waiting", label: "Awaiting reply" },
  { key: "done", label: "Completed" },
  { key: "all", label: "All" },
];

const matches = (f: Filter, e: SerializedTrackedEmail) => {
  switch (f) {
    case "action":
      return ["reminder_due", "drafting", "draft_ready", "sending"].includes(e.status);
    case "waiting":
      return e.status === "pending";
    case "done":
      return ["follow_up_sent", "replied", "dismissed", "cancelled"].includes(e.status);
    default:
      return true;
  }
};

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-[#27272a] bg-[#0f0f10] p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function FollowUpsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const openId = params.get("open");

  const [filter, setFilter] = useState<Filter>("action");
  const [composer, setComposer] = useState<SerializedTrackedEmail | null>(null);
  const { data, isPending, isError, refetch, isFetching } = useFollowUps();

  const items = useMemo(() => data?.data ?? [], [data]);
  const visible = useMemo(() => items.filter((e) => matches(filter, e)), [items, filter]);

  // Deep link from a notification: ?open=<id> opens the follow-up workflow.
  useEffect(() => {
    if (!openId || composer) return;
    const target = items.find((e) => e.id === openId);
    if (!target) return;
    if (["reminder_due", "draft_ready", "drafting"].includes(target.status)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setComposer(target);
    }
    router.replace("/dashboard/follow-ups", { scroll: false });
  }, [openId, items, composer, router]);

  const summary = data?.summary;

  return (
    <div className="mx-auto min-h-full w-full max-w-4xl space-y-5 bg-[#0a0a0a] p-4 sm:p-5 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Smart Follow-ups</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            Emails you send through JobPilot are tracked. If nobody replies within 10 days, we
            remind you and can draft a follow-up. Nothing is ever sent without your approval.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#27272a] bg-[#111111] px-3.5 text-xs font-medium text-zinc-200 hover:border-[#3f3f46] disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Awaiting reply" value={summary?.awaitingReply ?? 0} tone="text-zinc-100" />
        <Stat label="Due reminders" value={summary?.dueReminders ?? 0} tone="text-orange-300" />
        <Stat label="Drafts ready" value={summary?.draftsReady ?? 0} tone="text-blue-300" />
        <Stat label="Replied" value={summary?.replied ?? 0} tone="text-emerald-300" />
      </div>

      <div
        role="tablist"
        aria-label="Filter follow-ups"
        className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#27272a] bg-[#111111] p-1 sm:inline-flex"
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`h-8 shrink-0 rounded-lg px-3.5 text-xs font-medium transition-colors ${
              filter === f.key ? "bg-[#1f1f23] text-white" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <ul aria-busy="true" aria-label="Loading follow-ups" className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-32 animate-pulse rounded-2xl border border-[#27272a] bg-[#0f0f10]" />
          ))}
        </ul>
      ) : isError ? (
        <div className="flex flex-col items-center rounded-2xl border border-[#27272a] bg-[#0f0f10] px-6 py-12 text-center">
          <AlertTriangle className="mb-3 h-6 w-6 text-amber-400" />
          <p className="text-sm font-semibold text-zinc-200">Couldn&apos;t load your follow-ups</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-[#27272a] bg-[#111111] px-4 text-xs font-medium text-zinc-200 hover:border-[#3f3f46]"
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Try again
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-[#27272a] bg-[#0f0f10] px-6 py-14 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#27272a] bg-[#111111] text-zinc-500">
            {filter === "action" ? <CheckCircle2 className="h-5 w-5" /> : filter === "waiting" ? <MailQuestionMark className="h-5 w-5" /> : <MailCheck className="h-5 w-5" />}
          </span>
          <p className="text-sm font-semibold text-zinc-200">
            {items.length === 0 ? "No tracked emails yet" : "Nothing here"}
          </p>
          <p className="mt-1 max-w-xs text-xs text-zinc-500">
            {items.length === 0
              ? "Send an application email from the dashboard and JobPilot will track replies for you."
              : filter === "action"
                ? "You have no follow-ups waiting for action."
                : "No emails match this filter."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((e) => (
            <FollowUpCard key={e.id} email={e} onOpenComposer={setComposer} />
          ))}
        </ul>
      )}

      {composer && (
        <FollowUpComposer
          key={composer.id}
          email={composer}
          onClose={() => setComposer(null)}
        />
      )}
    </div>
  );
}

export default function FollowUpsPage() {
  return (
    <Suspense fallback={null}>
      <FollowUpsContent />
    </Suspense>
  );
}
