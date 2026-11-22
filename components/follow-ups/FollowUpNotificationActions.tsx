"use client";

import { toast } from "sonner";
import { PenLine, XCircle } from "lucide-react";
import {
  useDismissFollowUp,
  useSnoozeFollowUp,
} from "@/app/hooks/useFollowUps";
import { followUpErrorMessage } from "@/services/followup.client";
import { SnoozeMenu } from "./SnoozeMenu";

interface Props {
  trackedEmailId: string;
  /** Opens the follow-up workflow (the composer on the Smart Follow-ups page). */
  onDraft: () => void;
}

/**
 * Draft Follow-up / Remind Me Later / Dismiss buttons shown inside a
 * follow-up reminder notification. "Draft Follow-up" only opens the composer.
 */
export function FollowUpNotificationActions({ trackedEmailId, onDraft }: Props) {
  const snooze = useSnoozeFollowUp();
  const dismiss = useDismissFollowUp();

  return (
    <div className="flex basis-full flex-wrap items-center gap-2 pl-12">
      <button
        type="button"
        onClick={onDraft}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-3 text-xs font-semibold text-white hover:opacity-90"
      >
        <PenLine className="h-3.5 w-3.5" /> Draft Follow-up
      </button>
      <SnoozeMenu
        pending={snooze.isPending}
        onSnooze={(c) =>
          snooze.mutate(
            { id: trackedEmailId, ...c },
            {
              onSuccess: () => toast.success("We'll remind you later."),
              onError: (err) =>
                toast.error(followUpErrorMessage(err, "This reminder can no longer be snoozed.")),
            },
          )
        }
      />
      <button
        type="button"
        disabled={dismiss.isPending}
        onClick={() =>
          dismiss.mutate(trackedEmailId, {
            onSuccess: () => toast.success("Reminder dismissed."),
            onError: (err) =>
              toast.error(followUpErrorMessage(err, "This reminder can no longer be dismissed.")),
          })
        }
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#111111] px-3 text-xs font-medium text-zinc-400 hover:border-[#3f3f46] hover:text-white disabled:opacity-50"
      >
        <XCircle className="h-3.5 w-3.5" /> Dismiss
      </button>
    </div>
  );
}
