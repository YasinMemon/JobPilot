import type mongoose from "mongoose";

// ─── Status ───────────────────────────────────────────────────────────────────

export const FOLLOW_UP_STATUSES = [
  "pending", // waiting for nextFollowUpAt
  "reminder_due", // reminder notification created, user has not acted yet
  "drafting", // AI draft being generated
  "draft_ready", // draft saved, awaiting user approval
  "sending", // user clicked Send; Gmail call in flight (send lock)
  "follow_up_sent", // follow-up confirmed sent by Gmail
  "replied", // recipient replied; no follow-up required
  "dismissed", // user dismissed the reminder
  "cancelled", // tracking cancelled
] as const;

export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

/** States in which the user can still act on a reminder. */
export const ACTIONABLE_STATUSES: readonly FollowUpStatus[] = [
  "reminder_due",
  "drafting",
  "draft_ready",
];

/** States in which a Gmail reply check can still change the outcome. */
export const REPLY_WATCH_STATUSES: readonly FollowUpStatus[] = [
  "pending",
  "reminder_due",
  "drafting",
  "draft_ready",
  "follow_up_sent",
];

// ─── Schedule ─────────────────────────────────────────────────────────────────

/**
 * Days after the previous email for each follow-up in the sequence.
 * Version 1 only uses the first entry; adding `7` later (second reminder
 * 7 days after the first follow-up) needs no schema change.
 */
export const FOLLOW_UP_SCHEDULE_DAYS = [10] as const;
export const FIRST_FOLLOW_UP_DAYS = FOLLOW_UP_SCHEDULE_DAYS[0];
export const MAX_FOLLOW_UPS = FOLLOW_UP_SCHEDULE_DAYS.length;

// ─── History ──────────────────────────────────────────────────────────────────

export const FOLLOW_UP_EVENT_TYPES = [
  "email_sent",
  "reminder_created",
  "draft_generated",
  "draft_saved",
  "snoozed",
  "dismissed",
  "follow_up_sent",
  "follow_up_failed",
  "reply_detected",
] as const;

export type FollowUpEventType = (typeof FOLLOW_UP_EVENT_TYPES)[number];

export interface IFollowUpEvent {
  type: FollowUpEventType;
  at: Date;
  /** 1-based index in the sequence (follow_up_* events). */
  followUpNumber?: number;
  subject?: string;
  body?: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
  note?: string;
}

export interface IFollowUpDraft {
  to: string;
  subject: string;
  /** HTML body. */
  body: string;
  /** true when produced by AI. */
  aiGenerated: boolean;
  generatedAt?: Date | null;
  updatedAt: Date;
}

// ─── Mongoose document ────────────────────────────────────────────────────────

export interface ITrackedEmail {
  userId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId | null;

  recipientEmail: string;
  recipientName?: string;
  /** Lower-cased addresses (to/cc/bcc) whose messages count as a reply. */
  monitoredAddresses: string[];
  /** Lower-cased address of the sending Gmail account. */
  senderEmail?: string;

  subject: string;
  originalBody: string;

  gmailMessageId: string;
  gmailThreadId: string;
  sentAt: Date;

  status: FollowUpStatus;
  nextFollowUpAt: Date | null;
  /** Incremented on every snooze so each reminder cycle has its own dedupe key. */
  reminderCycle: number;
  reminderNotificationId?: mongoose.Types.ObjectId | null;
  reminderCreatedAt?: Date | null;

  draft?: IFollowUpDraft | null;
  followUpCount: number;
  lastFollowUpAt?: Date | null;
  followUpHistory: IFollowUpEvent[];

  replyReceivedAt?: Date | null;
  lastCheckedAt?: Date | null;
  checkFailures: number;
  lastCheckError?: string | null;

  /** Scheduler claim: other workers skip the record until this passes. */
  lockedUntil?: Date | null;
  /** Send lock timestamp while status === "sending". */
  sendingStartedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Serialized (client) ──────────────────────────────────────────────────────

export interface SerializedFollowUpEvent {
  type: FollowUpEventType;
  at: string;
  followUpNumber?: number;
  subject?: string;
  body?: string;
  gmailMessageId?: string;
  note?: string;
}

export interface SerializedTrackedEmail {
  id: string;
  applicationId: string | null;
  company: string;
  position: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  originalBody: string;
  sentAt: string;
  status: FollowUpStatus;
  nextFollowUpAt: string | null;
  reminderCreatedAt: string | null;
  draft: {
    to: string;
    subject: string;
    body: string;
    aiGenerated: boolean;
    generatedAt: string | null;
    updatedAt: string;
  } | null;
  followUpCount: number;
  lastFollowUpAt: string | null;
  replyReceivedAt: string | null;
  lastCheckedAt: string | null;
  lastCheckError: string | null;
  followUpHistory: SerializedFollowUpEvent[];
  createdAt: string;
}

export interface FollowUpSummary {
  awaitingReply: number;
  dueReminders: number;
  draftsReady: number;
  followUpsSent: number;
  replied: number;
}
