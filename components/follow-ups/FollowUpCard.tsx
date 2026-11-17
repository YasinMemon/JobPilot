"use client";

import { useState } from "react";
import { AlertTriangle, Clock, History, PenLine, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useCheckReply, useDismissFollowUp, useSnoozeFollowUp } from "@/app/hooks/useFollowUps";
import { followUpErrorMessage } from "@/services/followup.client";
import { SnoozeMenu } from "@/components/follow-ups/SnoozeMenu";
import { STATUS_META, dueLabel, formatDate } from "@/components/follow-ups/status";
import type { SerializedTrackedEmail } from "@/types/followups/type";
import { FollowUpHistory } from "./FollowUpHistory";

export function FollowUpCard({
  email,
  onOpenComposer,
}: {
  email: SerializedTrackedEmail;
  onOpenComposer: (e: SerializedTrackedEmail) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const snooze = useSnoozeFollowUp();
  const dismiss = useDismissFollowUp();
  const check = useCheckReply();

  const meta = STATUS_META[email.status];
  const actionable = ["reminder_due", "draft_ready"].includes(email.status);
  const title = [email.position, email.company].filter(Boolean).join(" · ") || email.subject;

  return (
    <li className="rounded-2xl border border-[#27272a] bg-[#0f0f10] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{title}</h3>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            To {email.recipientName ? `${email.recipientName} · ` : ""}
            {email.recipientEmail}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.tone}`}>
          {meta.label}
        </span>
      </div>

      <p className="mt-2 truncate text-xs text-zinc-400">Subject: {email.subject}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
        <span>Sent {formatDate(email.sentAt)}</span>
        {email.status === "pending" && email.nextFollowUpAt && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {dueLabel(email.nextFollowUpAt)}
          </span>
        )}
        {email.lastFollowUpAt && <span>Follow-up sent {formatDate(email.lastFollowUpAt)}</span>}
        {email.replyReceivedAt && <span>Replied {formatDate(email.replyReceivedAt)}</span>}
        {email.followUpCount > 0 && <span>{email.followUpCount} follow-up{email.followUpCount > 1 ? "s" : ""} sent</span>}
      </p>

      {email.lastCheckError && email.status === "pending" && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400">
          <AlertTriangle className="h-3 w-3" /> Couldn&apos;t check Gmail: {email.lastCheckError}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {(actionable || email.status === "drafting") && (
          <button
            type="button"
            onClick={() => onOpenComposer(email)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-3.5 text-xs font-semibold text-white hover:opacity-90"
          >
            <PenLine className="h-3.5 w-3.5" />
            {email.status === "draft_ready" ? "Edit draft" : "Draft Follow-up"}
          </button>
        )}
        {actionable && (
          <>
            <SnoozeMenu
              pending={snooze.isPending}
              onSnooze={(c) =>
                snooze.mutate(
                  { id: email.id, ...c },
                  {
                    onSuccess: () => toast.success("We'll remind you later."),
                    onError: (err) => toast.error(followUpErrorMessage(err, "Couldn't snooze the reminder.")),
                  },
                )
              }
            />
            <button
              type="button"
              disabled={dismiss.isPending}
              onClick={() =>
                dismiss.mutate(email.id, {
                  onSuccess: () => toast.success("Reminder dismissed."),
                  onError: (err) => toast.error(followUpErrorMessage(err, "Couldn't dismiss the reminder.")),
                })
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#111111] px-3 text-xs font-medium text-zinc-400 hover:border-[#3f3f46] hover:text-white disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" /> Dismiss
            </button>
          </>
        )}
        {["pending", "reminder_due", "follow_up_sent"].includes(email.status) && (
          <button
            type="button"
            disabled={check.isPending}
            onClick={() =>
              check.mutate(email.id, {
                onSuccess: (r) =>
                  r.replied
                    ? toast.success("The recipient has replied. Follow-up cancelled.")
                    : toast.message("No reply yet."),
                onError: (err) => toast.error(followUpErrorMessage(err, "Couldn't check Gmail.")),
              })
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#111111] px-3 text-xs font-medium text-zinc-400 hover:border-[#3f3f46] hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${check.isPending ? "animate-spin" : ""}`} />
            Check for reply
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          aria-expanded={showHistory}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-zinc-500 hover:text-zinc-200"
        >
          <History className="h-3.5 w-3.5" /> History
        </button>
      </div>

      {showHistory && (
        <div className="mt-4 border-t border-[#1f1f23] pt-4">
          <FollowUpHistory events={email.followUpHistory} />
        </div>
      )}
    </li>
  );
}
