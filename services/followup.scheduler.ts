import type { gmail_v1 } from "googleapis";
import mongoose from "mongoose";
import ConnectDB from "@/lib/db";
import TrackedEmailModel from "@/models/TrackedEmail";
import ApplicationModel from "@/models/applications";
import {
  createGmailClientForUser,
  isAuthFailure,
  sleep,
} from "@/lib/gmail/userClient";
import { checkThreadForReply } from "@/lib/followups/replyDetection";
import { createNotification, deleteNotificationByDedupeKey } from "@/services/notification.service";
import { DAY_MS, markReplied, reminderDedupeKey } from "@/services/followup.service";
import type { IFollowUpEvent, ITrackedEmail } from "@/types/followups/type";

/**
 * Server-side follow-up scheduler. Invoked by the cron route; does not depend
 * on any browser session.
 *
 * Idempotency / concurrency:
 *  - every record is claimed with an atomic `lockedUntil` update, so two
 *    overlapping runs never process the same record;
 *  - the pending → reminder_due transition is conditional on `pending`;
 *  - the reminder notification carries a per-cycle dedupe key.
 * Failures back the record off (lockedUntil in the future) instead of
 * releasing it, so a broken Gmail connection is not hammered within one run.
 */

type Doc = ITrackedEmail & { _id: mongoose.Types.ObjectId };

const CLAIM_MS = 5 * 60 * 1000;
const MAX_BACKOFF_H = 24;
/** Records already past their reminder are re-checked for replies at most this often. */
const RECHECK_MS = 20 * 60 * 60 * 1000;
/** Stop watching for a reply to a sent follow-up after this long. */
const POST_FOLLOW_UP_WATCH_MS = 30 * DAY_MS;

export interface SchedulerOptions {
  now?: Date;
  /** Maximum records processed per run (across both passes). */
  batchSize?: number;
  /** Wall-clock budget; stop claiming new records after this. */
  budgetMs?: number;
  /** Pause between Gmail calls (rate-limit friendliness). */
  throttleMs?: number;
  sleepFn?: (ms: number) => Promise<void>;
}

export interface SchedulerResult {
  claimed: number;
  remindersCreated: number;
  repliesDetected: number;
  stillWatching: number;
  cancelled: number;
  failed: number;
}

async function claimOne(
  filter: Record<string, unknown>,
  sort: Record<string, 1 | -1>,
  now: Date,
): Promise<Doc | null> {
  return (await TrackedEmailModel.findOneAndUpdate(
    {
      $and: [
        filter,
        { $or: [{ lockedUntil: null }, { lockedUntil: { $exists: false } }, { lockedUntil: { $lt: now } }] },
      ],
    },
    { $set: { lockedUntil: new Date(now.getTime() + CLAIM_MS) } },
    { sort, returnDocument: "after" },
  ).lean()) as unknown as Doc | null;
}

function describeJob(company?: string, position?: string): string {
  const c = company?.trim();
  const p = position?.trim();
  if (c && p) return `${c} regarding the ${p} position`;
  if (c) return c;
  if (p) return `a company regarding the ${p} position`;
  return "";
}

export function buildReminderCopy(
  doc: Pick<Doc, "recipientName" | "recipientEmail" | "subject" | "sentAt">,
  app: { company?: string; position?: string } | null,
  now: Date,
): { title: string; message: string } {
  const days = Math.max(1, Math.floor((now.getTime() - new Date(doc.sentAt).getTime()) / DAY_MS));
  const target =
    describeJob(app?.company, app?.position) ||
    `${doc.recipientName || doc.recipientEmail} about "${doc.subject}"`;
  return {
    title: "Time to follow up!",
    message:
      `You sent an email to ${target} ${days} days ago, but haven't received a response yet.\n\n` +
      `Would you like JobPilot to draft a follow-up email?`,
  };
}

export async function runFollowUpScheduler(
  opts: SchedulerOptions = {},
): Promise<SchedulerResult> {
  const now = opts.now ?? new Date();
  const batchSize = opts.batchSize ?? 25;
  const budgetMs = opts.budgetMs ?? 45_000;
  const throttleMs = opts.throttleMs ?? 150;
  const wait = opts.sleepFn ?? sleep;
  const startedAt = Date.now();

  await ConnectDB();

  const result: SchedulerResult = {
    claimed: 0,
    remindersCreated: 0,
    repliesDetected: 0,
    stillWatching: 0,
    cancelled: 0,
    failed: 0,
  };

  const gmailByUser = new Map<string, gmail_v1.Gmail | Error>();
  const getGmail = async (userId: string): Promise<gmail_v1.Gmail> => {
    let entry = gmailByUser.get(userId);
    if (!entry) {
      try {
        entry = await createGmailClientForUser(userId);
      } catch (err) {
        entry = err instanceof Error ? err : new Error(String(err));
      }
      gmailByUser.set(userId, entry);
    }
    if (entry instanceof Error) throw entry;
    return entry;
  };

  const outOfBudget = () =>
    result.claimed >= batchSize || Date.now() - startedAt > budgetMs;

  const fail = async (doc: Doc, err: unknown) => {
    result.failed++;
    const failures = (doc.checkFailures ?? 0) + 1;
    const backoffH = Math.min(2 ** (failures - 1), MAX_BACKOFF_H);
    const message = ((err as Error)?.message ?? "Unknown error").slice(0, 300);
    console.error(
      `[follow-ups] check failed for ${String(doc._id)} (attempt ${failures}):`,
      isAuthFailure(err) ? "Google authorisation problem" : message,
    );
    await TrackedEmailModel.updateOne(
      { _id: doc._id },
      {
        $set: {
          checkFailures: failures,
          lastCheckError: isAuthFailure(err)
            ? "Google connection needs to be re-authorised."
            : message,
          lastCheckedAt: now,
          lockedUntil: new Date(now.getTime() + backoffH * 60 * 60 * 1000),
        },
      },
    );
  };

  // ── Pass 1: due reminders ────────────────────────────────────────────────
  while (!outOfBudget()) {
    const doc = await claimOne(
      { status: "pending", nextFollowUpAt: { $lte: now } },
      { nextFollowUpAt: 1 },
      now,
    );
    if (!doc) break;
    result.claimed++;

    try {
      const gmail = await getGmail(String(doc.userId));
      const check = await checkThreadForReply(gmail, doc);
      await wait(throttleMs);

      if (!check.threadFound) {
        await TrackedEmailModel.updateOne(
          { _id: doc._id, status: "pending" },
          {
            $set: { status: "cancelled", nextFollowUpAt: null, lockedUntil: null },
            $push: {
              followUpHistory: {
                type: "dismissed",
                at: now,
                note: "Gmail thread no longer exists",
              } satisfies IFollowUpEvent,
            },
          },
        );
        result.cancelled++;
        continue;
      }

      if (check.replied && check.replyAt) {
        if (await markReplied(doc, { replyAt: check.replyAt, replyMessageId: check.replyMessageId })) {
          result.repliesDetected++;
        }
        continue;
      }

      // No reply → remind (notification first; dedupe key makes it idempotent).
      const app = doc.applicationId
        ? await ApplicationModel.findOne(
            { _id: doc.applicationId, userId: doc.userId },
            { company: 1, position: 1 },
          ).lean()
        : null;
      const copy = buildReminderCopy(doc, app, now);
      const dedupeKey = reminderDedupeKey(doc._id, doc.reminderCycle);

      const notif = await createNotification({
        userId: doc.userId,
        type: "follow_up_reminder",
        title: copy.title,
        message: copy.message,
        link: `/dashboard/follow-ups?open=${String(doc._id)}`,
        metadata: {
          trackedEmailId: String(doc._id),
          applicationId: doc.applicationId ? String(doc.applicationId) : null,
          cycle: doc.reminderCycle,
        },
        dedupeKey,
      });

      const res = await TrackedEmailModel.updateOne(
        { _id: doc._id, status: "pending" },
        {
          $set: {
            status: "reminder_due",
            reminderCreatedAt: now,
            lockedUntil: null,
            lastCheckedAt: now,
            checkFailures: 0,
            lastCheckError: null,
            ...(notif.notification
              ? { reminderNotificationId: new mongoose.Types.ObjectId(notif.notification.id) }
              : {}),
          },
          $push: {
            followUpHistory: { type: "reminder_created", at: now } satisfies IFollowUpEvent,
          },
        },
      );
      if (res.modifiedCount > 0) {
        result.remindersCreated++;
      } else if (notif.created) {
        // Lost the race (e.g. a manual check marked it replied after our Gmail
        // check). markReplied ran before this notification existed, so remove
        // the stale reminder ourselves.
        await deleteNotificationByDedupeKey(doc.userId, dedupeKey).catch(() => false);
      }
    } catch (err) {
      await fail(doc, err);
    }
  }

  // ── Pass 2: late reply detection for reminders awaiting action / follow-ups ─
  while (!outOfBudget()) {
    const doc = await claimOne(
      {
        $or: [
          { status: { $in: ["reminder_due", "draft_ready"] } },
          {
            status: "follow_up_sent",
            lastFollowUpAt: { $gt: new Date(now.getTime() - POST_FOLLOW_UP_WATCH_MS) },
          },
        ],
        $and: [
          {
            $or: [
              { lastCheckedAt: null },
              { lastCheckedAt: { $exists: false } },
              { lastCheckedAt: { $lt: new Date(now.getTime() - RECHECK_MS) } },
            ],
          },
        ],
      },
      { lastCheckedAt: 1 },
      now,
    );
    if (!doc) break;
    result.claimed++;

    try {
      const gmail = await getGmail(String(doc.userId));
      const check = await checkThreadForReply(gmail, doc);
      await wait(throttleMs);

      if (check.replied && check.replyAt) {
        if (await markReplied(doc, { replyAt: check.replyAt, replyMessageId: check.replyMessageId })) {
          result.repliesDetected++;
        }
      } else {
        result.stillWatching++;
        await TrackedEmailModel.updateOne(
          { _id: doc._id },
          { $set: { lastCheckedAt: now, lockedUntil: null, checkFailures: 0, lastCheckError: null } },
        );
      }
    } catch (err) {
      await fail(doc, err);
    }
  }

  return result;
}
