import mongoose from "mongoose";
import ConnectDB from "@/lib/db";
import {
  createNotification,
  createNotificationForUsers,
} from "@/services/notification.service";

/**
 * Event → notification mapping.
 *
 * Every helper here is fire-and-forget safe: a notification failure must never
 * break the business operation that caused it, so errors are logged and
 * swallowed. Each helper builds a deterministic `dedupeKey` from the event so
 * retries / double submits cannot create duplicates.
 */

type Id = string | mongoose.Types.ObjectId;

async function safely(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(`[notifications] ${label} failed:`, err);
  }
}

function describeJob(company?: string, position?: string): string {
  const c = company?.trim();
  const p = position?.trim();
  if (p && c) return `${p} at ${c}`;
  return p || c || "a job application";
}

export function formatInterviewTime(date: Date): string {
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
}

// ─── 1. Application creation ──────────────────────────────────────────────────

/**
 * Applications are created by the Gmail sync. One summary notification is
 * emitted per sync run (not one per email) so a 50-email import cannot flood
 * the inbox. The key is derived from the imported Gmail message ids.
 */
export function notifyApplicationsImported(
  userId: Id,
  imported: { gmailMessageId: string; company?: string; position?: string }[],
): Promise<void> {
  return safely("applications imported", async () => {
    if (imported.length === 0) return;

    const ids = imported.map((a) => a.gmailMessageId).sort();
    const first = imported[0];
    const message =
      imported.length === 1
        ? `We found ${describeJob(first.company, first.position)} in your Gmail and added it to your applications.`
        : `We found ${imported.length} new job applications in your Gmail and added them to your applications.`;

    await createNotification({
      userId,
      type: "application_created",
      title:
        imported.length === 1
          ? "New application tracked"
          : `${imported.length} new applications tracked`,
      message,
      link: "/dashboard/applications",
      metadata: { count: imported.length },
      dedupeKey: `app-import:${ids.join(",").slice(0, 250)}`,
    });
  });
}

// ─── 2. Status change ─────────────────────────────────────────────────────────

export function notifyApplicationStatusChanged(
  userId: Id,
  app: { id: string; company?: string; position?: string },
  from: string,
  to: string,
  /** Distinguishes two real transitions between the same statuses. */
  changedAt: Date = new Date(),
): Promise<void> {
  return safely("status change", async () => {
    if (from === to) return;
    await createNotification({
      userId,
      type: "application_status_changed",
      title: `Application status: ${to}`,
      message: `${describeJob(app.company, app.position)} moved from ${from} to ${to}.`,
      link: "/dashboard/applications",
      metadata: { applicationId: app.id, from, to },
      dedupeKey: `status:${app.id}:${from}:${to}:${changedAt.getTime()}`,
    });
  });
}

// ─── 3. Interview scheduling ──────────────────────────────────────────────────

export function notifyInterviewScheduled(
  userId: Id,
  app: { id: string; company?: string; position?: string },
  interviewAt: Date,
  rescheduled: boolean,
): Promise<void> {
  return safely("interview scheduled", async () => {
    await createNotification({
      userId,
      type: "interview_scheduled",
      title: rescheduled ? "Interview rescheduled" : "Interview scheduled",
      message: `${describeJob(app.company, app.position)} — ${formatInterviewTime(interviewAt)}.`,
      link: "/dashboard/applications",
      metadata: { applicationId: app.id, interviewAt: interviewAt.toISOString() },
      dedupeKey: `interview-scheduled:${app.id}:${interviewAt.getTime()}`,
    });
  });
}

// ─── 4. Interview reminders (called by the cron route) ────────────────────────

export type ReminderWindow = "24h" | "1h";

/** Returns true when a new reminder was created (false = already sent). */
export async function notifyInterviewReminder(
  userId: Id,
  app: { id: string; company?: string; position?: string },
  interviewAt: Date,
  window: ReminderWindow,
): Promise<boolean> {
  const result = await createNotification({
    userId,
    type: "interview_reminder",
    title: window === "1h" ? "Interview in under 1 hour" : "Upcoming interview",
    message: `${describeJob(app.company, app.position)} — ${formatInterviewTime(interviewAt)}.`,
    link: "/dashboard/applications",
    metadata: {
      applicationId: app.id,
      interviewAt: interviewAt.toISOString(),
      window,
    },
    dedupeKey: `interview-reminder:${app.id}:${interviewAt.getTime()}:${window}`,
  });
  return result.created;
}

// ─── 5. Matching job alerts ───────────────────────────────────────────────────

/**
 * Ready for the future job feed. JobPilot currently has no job listings
 * source (the Jobs page is "Coming soon"), so nothing calls this yet.
 */
export function notifyJobMatch(
  userId: Id,
  job: { id: string; title: string; company?: string; matchScore?: number },
): Promise<void> {
  return safely("job match", async () => {
    await createNotification({
      userId,
      type: "job_match",
      title: "New job matches your profile",
      message: `${describeJob(job.company, job.title)}${
        job.matchScore ? ` (${job.matchScore}% match)` : ""
      }.`,
      link: "/dashboard/jobs",
      metadata: { jobId: job.id, matchScore: job.matchScore },
      dedupeKey: `job-match:${job.id}`,
    });
  });
}

// ─── 6. Account & security ────────────────────────────────────────────────────

export type SecurityEvent =
  | "password_changed"
  | "google_connected"
  | "google_disconnected";

const SECURITY_COPY: Record<SecurityEvent, { title: string; message: string }> = {
  password_changed: {
    title: "Password changed",
    message:
      "Your JobPilot password was just changed. If this wasn't you, reset your password immediately.",
  },
  google_connected: {
    title: "Google account connected",
    message: "A Google account was connected to your JobPilot account.",
  },
  google_disconnected: {
    title: "Google account disconnected",
    message:
      "Your Google account was disconnected. Gmail syncing is paused until you reconnect.",
  },
};

export function notifySecurityEvent(
  userId: Id,
  event: SecurityEvent,
  occurredAt: Date = new Date(),
): Promise<void> {
  return safely(`security:${event}`, async () => {
    const copy = SECURITY_COPY[event];
    await createNotification({
      userId,
      type: "security",
      title: copy.title,
      message: copy.message,
      link: "/dashboard/settings",
      metadata: { event },
      // One per event per minute: absorbs duplicate hook invocations.
      dedupeKey: `security:${event}:${Math.floor(occurredAt.getTime() / 60000)}`,
    });
  });
}

// ─── 7. Platform announcements ────────────────────────────────────────────────

/**
 * Fan an announcement out to every user. Idempotent per `announcementId`.
 * Better Auth owns the `user` collection, so ids are read from it directly.
 */
export async function broadcastAnnouncement(input: {
  announcementId: string;
  title: string;
  message: string;
  link?: string;
}): Promise<{ recipients: number; created: number }> {
  await ConnectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const users = await db
    .collection("user")
    .find({}, { projection: { _id: 1 } })
    .toArray();

  const { created } = await createNotificationForUsers(
    users.map((u) => u._id as mongoose.Types.ObjectId),
    {
      type: "announcement",
      title: input.title,
      message: input.message,
      link: input.link,
      metadata: { announcementId: input.announcementId },
      dedupeKey: `announcement:${input.announcementId}`,
    },
  );

  return { recipients: users.length, created };
}
