import type mongoose from "mongoose";

// ─── Types ────────────────────────────────────────────────────────────────────

export const NOTIFICATION_TYPES = [
  "application_created",
  "application_status_changed",
  "interview_scheduled",
  "interview_reminder",
  "follow_up_reminder",
  "job_match",
  "security",
  "announcement",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export function isNotificationType(value: unknown): value is NotificationType {
  return (
    typeof value === "string" &&
    (NOTIFICATION_TYPES as readonly string[]).includes(value)
  );
}

// ─── Mongoose document (server-side) ──────────────────────────────────────────

export interface INotification {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  /** In-app path to open when the notification is clicked (must start with "/"). */
  link?: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date | null;
  /** Unique per user — a second create with the same key is a no-op. */
  dedupeKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Serialized (client-side) ─────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface NotificationListParams {
  limit?: number;
  cursor?: string | null;
  unreadOnly?: boolean;
}
