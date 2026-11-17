"use client";

import React from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CalendarPlus,
  MailQuestionMark,
  Megaphone,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { FollowUpNotificationActions } from "@/components/follow-ups/FollowUpNotificationActions";
import { formatRelativeDate } from "@/lib/serializers/application.serializer";
import type {
  Notification,
  NotificationType,
} from "@/types/notifications/type";

const TYPE_META: Record<
  NotificationType,
  { icon: LucideIcon; label: string; tone: string }
> = {
  application_created: {
    icon: BriefcaseBusiness,
    label: "Application",
    tone: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  application_status_changed: {
    icon: RefreshCw,
    label: "Status update",
    tone: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  interview_scheduled: {
    icon: CalendarPlus,
    label: "Interview",
    tone: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  interview_reminder: {
    icon: CalendarClock,
    label: "Reminder",
    tone: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  follow_up_reminder: {
    icon: MailQuestionMark,
    label: "Follow-up",
    tone: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  job_match: {
    icon: Sparkles,
    label: "Job match",
    tone: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  security: {
    icon: ShieldAlert,
    label: "Security",
    tone: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  announcement: {
    icon: Megaphone,
    label: "Announcement",
    tone: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
};

export function getNotificationMeta(type: NotificationType) {
  return (
    TYPE_META[type] ?? {
      icon: Bell,
      label: "Notification",
      tone: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    }
  );
}

interface NotificationItemProps {
  notification: Notification;
  onOpen: (n: Notification) => void;
  onDelete: (n: Notification) => void;
  /** Tighter paddings for the dropdown. */
  compact?: boolean;
}

export const NotificationItem = React.memo(function NotificationItem({
  notification: n,
  onOpen,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const meta = getNotificationMeta(n.type);
  const Icon = meta.icon;

  return (
    <li
      className={`group relative flex flex-wrap items-start gap-3 border-b border-[#1f1f23] transition-colors last:border-b-0 hover:bg-[#161618] ${
        compact ? "px-3 py-3" : "px-4 py-4 sm:px-5"
      } ${n.isRead ? "" : "bg-indigo-500/[0.04]"}`}
    >
      {/* Unread indicator */}
      {!n.isRead && (
        <span
          aria-hidden="true"
          className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
        />
      )}

      <button
        type="button"
        onClick={() => onOpen(n)}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
      >
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.tone}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span
              className={`truncate text-[13px] ${
                n.isRead ? "font-medium text-zinc-300" : "font-semibold text-white"
              }`}
            >
              {n.title}
            </span>
            <time
              dateTime={n.createdAt}
              className="shrink-0 text-[11px] text-zinc-500"
            >
              {formatRelativeDate(new Date(n.createdAt))}
            </time>
          </span>
          <span
            className={`mt-0.5 block text-xs leading-relaxed ${
              n.isRead ? "text-zinc-500" : "text-zinc-400"
            } ${compact ? "line-clamp-2" : ""}`}
          >
            {n.message}
          </span>
          {!compact && (
            <span className="mt-1.5 inline-block text-[10px] font-medium uppercase tracking-wide text-zinc-600">
              {meta.label}
            </span>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onDelete(n)}
        aria-label={`Delete notification: ${n.title}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {n.type === "follow_up_reminder" &&
        typeof n.metadata?.trackedEmailId === "string" && (
          <FollowUpNotificationActions
            trackedEmailId={n.metadata.trackedEmailId}
            onDraft={() => onOpen(n)}
          />
        )}
    </li>
  );
});
