"use client";

import type { FollowUpEventType, SerializedFollowUpEvent } from "@/types/followups/type";
import { formatDateTime } from "@/components/follow-ups/status";

const LABELS: Record<FollowUpEventType, string> = {
  email_sent: "Original email sent",
  reminder_created: "Follow-up reminder created",
  draft_generated: "AI draft generated",
  draft_saved: "Draft saved",
  snoozed: "Reminder snoozed",
  dismissed: "Reminder dismissed",
  follow_up_sent: "Follow-up sent",
  follow_up_failed: "Follow-up failed to send",
  reply_detected: "Recipient replied",
};

const DOT: Partial<Record<FollowUpEventType, string>> = {
  follow_up_sent: "bg-emerald-400",
  reply_detected: "bg-emerald-400",
  follow_up_failed: "bg-red-400",
  reminder_created: "bg-orange-400",
};

export function FollowUpHistory({ events }: { events: SerializedFollowUpEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-zinc-500">No history yet.</p>;
  }
  return (
    <ol className="space-y-3 border-l border-[#27272a] pl-4">
      {events.map((e, i) => (
        <li key={`${e.type}-${e.at}-${i}`} className="relative">
          <span
            aria-hidden="true"
            className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${DOT[e.type] ?? "bg-zinc-600"}`}
          />
          <p className="text-xs font-medium text-zinc-200">
            {LABELS[e.type]}
            {e.followUpNumber && e.type === "follow_up_sent" ? ` #${e.followUpNumber}` : ""}
          </p>
          <p className="text-[11px] text-zinc-500">{formatDateTime(e.at)}</p>
          {e.subject && e.type === "follow_up_sent" && (
            <p className="mt-0.5 truncate text-[11px] text-zinc-400">{e.subject}</p>
          )}
          {e.gmailMessageId && e.type === "follow_up_sent" && (
            <p className="text-[10px] text-zinc-600">Gmail message {e.gmailMessageId}</p>
          )}
          {e.note && <p className="mt-0.5 text-[11px] text-zinc-500">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
