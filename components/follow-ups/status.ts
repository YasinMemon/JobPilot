import type { FollowUpStatus } from "@/types/followups/type";

export const STATUS_META: Record<FollowUpStatus, { label: string; tone: string }> = {
  pending: { label: "Awaiting reply", tone: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20" },
  reminder_due: { label: "Follow-up due", tone: "bg-orange-500/10 text-orange-300 border-orange-500/20" },
  drafting: { label: "Drafting…", tone: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" },
  draft_ready: { label: "Draft ready", tone: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  sending: { label: "Sending…", tone: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" },
  follow_up_sent: { label: "Follow-up sent", tone: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  replied: { label: "Replied", tone: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  dismissed: { label: "Dismissed", tone: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
  cancelled: { label: "Cancelled", tone: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/** "in 3 days", "due today", "2 days overdue". */
export function dueLabel(iso: string | null, now = Date.now()): string {
  if (!iso) return "";
  const days = Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
  if (days > 1) return `Follow-up in ${days} days`;
  if (days === 1) return "Follow-up tomorrow";
  if (days === 0) return "Follow-up due today";
  return `Follow-up ${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`;
}

/** Compact badge for an application card; null when nothing is worth showing. */
export function followUpBadge(
  e: { status: FollowUpStatus; nextFollowUpAt: string | null },
  now = Date.now(),
): { label: string; tone: string } | null {
  switch (e.status) {
    case "reminder_due":
    case "drafting":
      return { label: "Follow-up due", tone: STATUS_META.reminder_due.tone };
    case "draft_ready":
      return { label: "Draft ready", tone: STATUS_META.draft_ready.tone };
    case "pending":
      return { label: dueLabel(e.nextFollowUpAt, now) || "Awaiting reply", tone: STATUS_META.pending.tone };
    case "follow_up_sent":
      return { label: "Follow-up sent", tone: STATUS_META.follow_up_sent.tone };
    case "replied":
      return { label: "Replied", tone: STATUS_META.replied.tone };
    default:
      return null;
  }
}
