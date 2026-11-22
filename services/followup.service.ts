import mongoose from "mongoose";
import ConnectDB from "@/lib/db";
import TrackedEmailModel from "@/models/TrackedEmail";
import ApplicationModel from "@/models/applications";
import userModel from "@/models/user";
import { composeRawEmail, buildSubject } from "@/lib/email/mime";
import {
  createGmailClientForUser,
  withGmailRetry,
} from "@/lib/gmail/userClient";
import {
  checkThreadForReply,
  extractEmailAddress,
  extractEmailAddresses,
  type ReplyCheckResult,
} from "@/lib/followups/replyDetection";
import {
  deleteNotificationByDedupeKey,
  markNotificationReadByDedupeKey,
} from "@/services/notification.service";
import {
  generateFollowUpDraft,
  stripHtml,
} from "@/services/followup.ai";
import {
  FIRST_FOLLOW_UP_DAYS,
  FOLLOW_UP_SCHEDULE_DAYS,
  type FollowUpStatus,
  type FollowUpSummary,
  type IFollowUpEvent,
  type ITrackedEmail,
  type SerializedTrackedEmail,
} from "@/types/followups/type";

// ─── Errors ───────────────────────────────────────────────────────────────────

export type FollowUpErrorCode =
  | "NOT_FOUND"
  | "INVALID_STATE"
  | "INVALID_INPUT"
  | "ALREADY_REPLIED"
  | "SEND_IN_PROGRESS"
  | "GMAIL_AUTH"
  | "GMAIL_ERROR"
  | "AI_ERROR";

export class FollowUpError extends Error {
  constructor(
    public code: FollowUpErrorCode,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "FollowUpError";
  }
}

// ─── Constants / helpers ──────────────────────────────────────────────────────

export const DAY_MS = 24 * 60 * 60 * 1000;
const DRAFT_LOCK_MS = 2 * 60 * 1000;
/** A "sending" claim older than this is considered abandoned (crashed worker). */
const SEND_LOCK_MS = 10 * 60 * 1000;
const MAX_RECIPIENTS = 5;
const MAX_BODY_LENGTH = 100_000;
const MAX_SNOOZE_DAYS = 90;

type Id = string | mongoose.Types.ObjectId;

function oid(value: Id): mongoose.Types.ObjectId | null {
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
}

/** First follow-up due date, computed from the real Gmail send time. */
export function computeFirstFollowUpAt(sentAt: Date): Date {
  return new Date(sentAt.getTime() + FIRST_FOLLOW_UP_DAYS * DAY_MS);
}

export function reminderDedupeKey(trackedId: Id, cycle: number): string {
  return `follow-up:${String(trackedId)}:${cycle}`;
}

function isDuplicateKeyError(err: unknown): boolean {
  return (err as { code?: number })?.code === 11000;
}

export function parseRecipients(
  to: string,
  cc?: string,
  bcc?: string,
): { email: string; name: string; monitored: string[] } {
  const first = to.split(/[,;]/)[0] ?? "";
  const email = extractEmailAddress(first);
  const nameMatch = first.match(/^\s*"?([^"<]+?)"?\s*</);
  const monitored = Array.from(
    new Set([
      ...extractEmailAddresses(to),
      ...extractEmailAddresses(cc),
      ...extractEmailAddresses(bcc),
    ]),
  );
  return { email, name: nameMatch?.[1]?.trim() ?? "", monitored };
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "");
}

function parseToField(to: string): string {
  const parts = to
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0 || parts.length > MAX_RECIPIENTS) {
    throw new FollowUpError("INVALID_INPUT", "Enter between 1 and 5 recipient emails.", 400);
  }
  const addresses = parts.map((p) => extractEmailAddress(p));
  if (addresses.some((a) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a))) {
    throw new FollowUpError("INVALID_INPUT", "One or more recipient emails are invalid.", 400);
  }
  return addresses.join(", ");
}

function validateDraftInput(input: { to: string; subject: string; body: string }) {
  const to = parseToField(input.to);
  const subject = buildSubject(input.subject).slice(0, 300);
  const body = sanitizeHtml(input.body ?? "");
  if (!input.subject?.trim()) {
    throw new FollowUpError("INVALID_INPUT", "Subject is required.", 400);
  }
  if (!stripHtml(body)) {
    throw new FollowUpError("INVALID_INPUT", "Email body cannot be empty.", 400);
  }
  if (body.length > MAX_BODY_LENGTH) {
    throw new FollowUpError("INVALID_INPUT", "Email body is too long.", 400);
  }
  return { to, subject, body };
}

// ─── Serialization ────────────────────────────────────────────────────────────

type TrackedDoc = ITrackedEmail & { _id: mongoose.Types.ObjectId };

const iso = (d?: Date | null) => (d ? new Date(d).toISOString() : null);

export function serializeTrackedEmail(
  doc: TrackedDoc,
  app?: { company?: string; position?: string } | null,
): SerializedTrackedEmail {
  return {
    id: doc._id.toString(),
    applicationId: doc.applicationId ? String(doc.applicationId) : null,
    company: app?.company ?? "",
    position: app?.position ?? "",
    recipientEmail: doc.recipientEmail,
    recipientName: doc.recipientName ?? "",
    subject: doc.subject,
    originalBody: doc.originalBody,
    sentAt: new Date(doc.sentAt).toISOString(),
    status: doc.status,
    nextFollowUpAt: iso(doc.nextFollowUpAt),
    reminderCreatedAt: iso(doc.reminderCreatedAt),
    draft: doc.draft
      ? {
          to: doc.draft.to,
          subject: doc.draft.subject,
          body: doc.draft.body,
          aiGenerated: doc.draft.aiGenerated,
          generatedAt: iso(doc.draft.generatedAt),
          updatedAt: new Date(doc.draft.updatedAt).toISOString(),
        }
      : null,
    followUpCount: doc.followUpCount,
    lastFollowUpAt: iso(doc.lastFollowUpAt),
    replyReceivedAt: iso(doc.replyReceivedAt),
    lastCheckedAt: iso(doc.lastCheckedAt),
    lastCheckError: doc.lastCheckError ?? null,
    followUpHistory: (doc.followUpHistory ?? []).map((e) => ({
      type: e.type,
      at: new Date(e.at).toISOString(),
      followUpNumber: e.followUpNumber,
      subject: e.subject,
      body: e.body,
      gmailMessageId: e.gmailMessageId,
      note: e.note,
    })),
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

async function loadApps(
  docs: TrackedDoc[],
): Promise<Map<string, { company: string; position: string }>> {
  const ids = docs
    .map((d) => d.applicationId)
    .filter((x): x is mongoose.Types.ObjectId => Boolean(x));
  const map = new Map<string, { company: string; position: string }>();
  if (ids.length === 0) return map;
  const apps = await ApplicationModel.find(
    { _id: { $in: ids } },
    { company: 1, position: 1 },
  ).lean();
  for (const a of apps) {
    map.set(String(a._id), { company: a.company ?? "", position: a.position ?? "" });
  }
  return map;
}

// ─── Tracking (called after Gmail confirms a send) ────────────────────────────

export interface TrackSentEmailInput {
  userId: Id;
  applicationId?: Id | null;
  to: string;
  cc?: string;
  bcc?: string;
  senderEmail?: string;
  subject: string;
  html: string;
  gmailMessageId: string;
  gmailThreadId: string;
  /** The real send time. */
  sentAt?: Date;
}

/**
 * Creates the tracking record for an email that Gmail has ALREADY accepted.
 * Idempotent per (user, gmailMessageId). Never throws for duplicates.
 */
export async function trackSentEmail(
  input: TrackSentEmailInput,
): Promise<{ created: boolean; id: string | null }> {
  const userId = oid(input.userId);
  if (!userId) throw new Error("trackSentEmail: invalid userId");
  if (!input.gmailMessageId || !input.gmailThreadId) {
    throw new Error("trackSentEmail: Gmail message and thread ids are required");
  }

  const { email, name, monitored } = parseRecipients(input.to, input.cc, input.bcc);
  if (!email) throw new Error("trackSentEmail: no valid recipient");

  const sentAt = input.sentAt ?? new Date();
  const applicationId = input.applicationId ? oid(input.applicationId) : null;

  await ConnectDB();

  const result = await TrackedEmailModel.updateOne(
    { userId, gmailMessageId: input.gmailMessageId },
    {
      $setOnInsert: {
        userId,
        applicationId,
        recipientEmail: email,
        recipientName: name,
        monitoredAddresses: monitored,
        senderEmail: (input.senderEmail ?? "").toLowerCase(),
        subject: buildSubject(input.subject),
        originalBody: input.html,
        gmailMessageId: input.gmailMessageId,
        gmailThreadId: input.gmailThreadId,
        sentAt,
        status: "pending",
        nextFollowUpAt: computeFirstFollowUpAt(sentAt),
        reminderCycle: 0,
        followUpCount: 0,
        checkFailures: 0,
        followUpHistory: [{ type: "email_sent", at: sentAt }],
      },
    },
    { upsert: true },
  ).catch((err) => {
    if (isDuplicateKeyError(err)) return null; // concurrent insert won the race
    throw err;
  });

  const doc = await TrackedEmailModel.findOne(
    { userId, gmailMessageId: input.gmailMessageId },
    { _id: 1 },
  ).lean();

  return { created: Boolean(result?.upsertedCount), id: doc ? String(doc._id) : null };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export interface ListTrackedOptions {
  status?: FollowUpStatus[];
  applicationId?: string;
  limit?: number;
  skip?: number;
}

export async function listTrackedEmails(
  userIdInput: Id,
  options: ListTrackedOptions = {},
): Promise<SerializedTrackedEmail[]> {
  const userId = oid(userIdInput);
  if (!userId) return [];
  await ConnectDB();

  const filter: Record<string, unknown> = { userId };
  if (options.status?.length) filter.status = { $in: options.status };
  if (options.applicationId) {
    const appId = oid(options.applicationId);
    if (!appId) return [];
    filter.applicationId = appId;
  }

  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const docs = (await TrackedEmailModel.find(filter)
    .sort({ sentAt: -1 })
    .skip(Math.max(options.skip ?? 0, 0))
    .limit(limit)
    .lean()) as unknown as TrackedDoc[];

  const apps = await loadApps(docs);
  return docs.map((d) =>
    serializeTrackedEmail(d, d.applicationId ? apps.get(String(d.applicationId)) : null),
  );
}

export async function getTrackedEmail(
  userIdInput: Id,
  id: string,
): Promise<SerializedTrackedEmail | null> {
  const doc = await findOwned(userIdInput, id);
  if (!doc) return null;
  const apps = await loadApps([doc]);
  return serializeTrackedEmail(doc, doc.applicationId ? apps.get(String(doc.applicationId)) : null);
}

async function findOwned(userIdInput: Id, id: string): Promise<TrackedDoc | null> {
  const userId = oid(userIdInput);
  const _id = oid(id);
  if (!userId || !_id) return null;
  await ConnectDB();
  return (await TrackedEmailModel.findOne({ _id, userId }).lean()) as unknown as TrackedDoc | null;
}

/** Counts for the page header / badges. Scoped to the user. */
export async function getFollowUpSummary(userIdInput: Id): Promise<FollowUpSummary> {
  const userId = oid(userIdInput);
  const empty = { awaitingReply: 0, dueReminders: 0, draftsReady: 0, followUpsSent: 0, replied: 0 };
  if (!userId) return empty;
  await ConnectDB();

  const rows = await TrackedEmailModel.aggregate<{ _id: FollowUpStatus; n: number }>([
    { $match: { userId } },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const n = (s: FollowUpStatus) => rows.find((r) => r._id === s)?.n ?? 0;
  return {
    awaitingReply: n("pending"),
    dueReminders: n("reminder_due") + n("drafting"),
    draftsReady: n("draft_ready"),
    followUpsSent: n("follow_up_sent"),
    replied: n("replied"),
  };
}

// ─── Reply handling ───────────────────────────────────────────────────────────

/**
 * Marks a tracked email as replied and cancels its pending reminder.
 * Conditional on the record not being in a terminal/"sending" state, so
 * running it twice is harmless.
 */
export async function markReplied(
  doc: Pick<TrackedDoc, "_id" | "userId" | "reminderCycle">,
  reply: { replyAt: Date; replyMessageId?: string },
): Promise<boolean> {
  const res = await TrackedEmailModel.updateOne(
    {
      _id: doc._id,
      status: { $in: ["pending", "reminder_due", "drafting", "draft_ready", "follow_up_sent"] },
    },
    {
      $set: {
        status: "replied",
        replyReceivedAt: reply.replyAt,
        nextFollowUpAt: null,
        lockedUntil: null,
        lastCheckedAt: new Date(),
        checkFailures: 0,
        lastCheckError: null,
      },
      $push: {
        followUpHistory: {
          type: "reply_detected",
          at: reply.replyAt,
          gmailMessageId: reply.replyMessageId,
        } satisfies IFollowUpEvent,
      },
    },
  );

  if (res.modifiedCount > 0) {
    // Cancel the pending reminder for every cycle that may have been created.
    for (let c = 0; c <= doc.reminderCycle; c++) {
      await deleteNotificationByDedupeKey(doc.userId, reminderDedupeKey(doc._id, c)).catch(
        () => false,
      );
    }
  }
  return res.modifiedCount > 0;
}

/** Live Gmail reply check for one user-owned tracked email (manual refresh). */
export async function checkReplyStatus(
  userIdInput: Id,
  id: string,
): Promise<{ replied: boolean; email: SerializedTrackedEmail }> {
  const doc = await findOwned(userIdInput, id);
  if (!doc) throw new FollowUpError("NOT_FOUND", "Tracked email not found.", 404);

  const result = await runReplyCheck(doc);
  if (result.replied && result.replyAt) {
    await markReplied(doc, { replyAt: result.replyAt, replyMessageId: result.replyMessageId });
  } else {
    await TrackedEmailModel.updateOne(
      { _id: doc._id },
      { $set: { lastCheckedAt: new Date(), lastCheckError: null } },
    );
  }
  const fresh = await getTrackedEmail(userIdInput, id);
  return { replied: result.replied, email: fresh! };
}

async function runReplyCheck(doc: TrackedDoc): Promise<ReplyCheckResult> {
  try {
    const gmail = await createGmailClientForUser(String(doc.userId));
    return await checkThreadForReply(gmail, doc);
  } catch (err) {
    throw toGmailError(err);
  }
}

function toGmailError(err: unknown): FollowUpError {
  if (err instanceof FollowUpError) return err;
  const message = (err as Error)?.message ?? "Gmail request failed";
  if ((err as Error)?.name === "GmailAuthError" || /invalid_grant|401/.test(message)) {
    return new FollowUpError(
      "GMAIL_AUTH",
      "Your Google connection needs to be re-authorised. Reconnect Google in Settings.",
      403,
    );
  }
  return new FollowUpError("GMAIL_ERROR", "Gmail request failed. Please try again.", 502);
}

// ─── Draft generation ─────────────────────────────────────────────────────────

async function candidateName(userId: Id): Promise<string> {
  const profile = await userModel
    .findOne({ authUserId: String(userId) }, { fullName: 1 })
    .lean<{ fullName?: string }>();
  return profile?.fullName?.trim() ?? "";
}

/**
 * Generates (or regenerates) an AI draft and stores it. Never sends.
 * Allowed only when the reminder is actionable.
 */
export async function generateDraft(
  userIdInput: Id,
  id: string,
  fallbackCandidateName = "",
): Promise<SerializedTrackedEmail> {
  const userId = oid(userIdInput);
  const _id = oid(id);
  if (!userId || !_id) throw new FollowUpError("NOT_FOUND", "Tracked email not found.", 404);
  await ConnectDB();

  const now = new Date();
  // Atomic claim → prevents two concurrent generations for the same record.
  const claimed = (await TrackedEmailModel.findOneAndUpdate(
    {
      _id,
      userId,
      $or: [
        { status: { $in: ["reminder_due", "draft_ready"] } },
        { status: "drafting", lockedUntil: { $lt: now } },
      ],
    },
    { $set: { status: "drafting", lockedUntil: new Date(now.getTime() + DRAFT_LOCK_MS) } },
    { returnDocument: "before" },
  ).lean()) as unknown as TrackedDoc | null;

  if (!claimed) {
    const existing = await findOwned(userId, id);
    if (!existing) throw new FollowUpError("NOT_FOUND", "Tracked email not found.", 404);
    throw new FollowUpError(
      "INVALID_STATE",
      "A follow-up draft can only be generated for a due reminder.",
      409,
    );
  }
  const revertStatus: FollowUpStatus = claimed.draft ? "draft_ready" : "reminder_due";

  try {
    // Do not draft a follow-up when the recipient has already answered.
    const reply = await runReplyCheck(claimed);
    if (reply.replied && reply.replyAt) {
      await TrackedEmailModel.updateOne({ _id }, { $set: { status: revertStatus } });
      await markReplied(claimed, { replyAt: reply.replyAt, replyMessageId: reply.replyMessageId });
      throw new FollowUpError(
        "ALREADY_REPLIED",
        "The recipient has already replied, so no follow-up is needed.",
        409,
      );
    }

    const app = claimed.applicationId
      ? await ApplicationModel.findOne(
          { _id: claimed.applicationId, userId },
          { company: 1, position: 1 },
        ).lean()
      : null;

    const generated = await generateFollowUpDraft({
      candidateName: (await candidateName(userId)) || fallbackCandidateName,
      recipientName: claimed.recipientName ?? "",
      recipientEmail: claimed.recipientEmail,
      company: app?.company ?? "",
      position: app?.position ?? "",
      originalSubject: claimed.subject,
      originalBody: stripHtml(claimed.originalBody),
      originalSentAt: claimed.sentAt,
      now,
      previousFollowUps: (claimed.followUpHistory ?? [])
        .filter((e) => e.type === "follow_up_sent" && e.body)
        .map((e) => ({ sentAt: e.at, body: stripHtml(e.body ?? "") })),
    }).catch((err) => {
      if (err instanceof FollowUpError) throw err;
      console.error("[follow-ups] AI generation failed:", (err as Error)?.message);
      throw new FollowUpError("AI_ERROR", "Couldn't generate the draft. Please try again.", 502);
    });

    const draftedAt = new Date();
    await TrackedEmailModel.updateOne(
      { _id, userId },
      {
        $set: {
          status: "draft_ready",
          lockedUntil: null,
          draft: {
            to: claimed.draft?.to || claimed.recipientEmail,
            subject: generated.subject,
            body: generated.html,
            aiGenerated: true,
            generatedAt: draftedAt,
            updatedAt: draftedAt,
          },
        },
        $push: {
          followUpHistory: {
            type: "draft_generated",
            at: draftedAt,
            followUpNumber: claimed.followUpCount + 1,
            subject: generated.subject,
          } satisfies IFollowUpEvent,
        },
      },
    );
  } catch (err) {
    // Restore a usable state unless the reply handler already finalised it.
    await TrackedEmailModel.updateOne(
      { _id, userId, status: "drafting" },
      { $set: { status: revertStatus, lockedUntil: null } },
    );
    throw err;
  }

  return (await getTrackedEmail(userId, id))!;
}

// ─── Draft saving ─────────────────────────────────────────────────────────────

export async function saveDraft(
  userIdInput: Id,
  id: string,
  input: { to: string; subject: string; body: string },
): Promise<SerializedTrackedEmail> {
  const userId = oid(userIdInput);
  const _id = oid(id);
  if (!userId || !_id) throw new FollowUpError("NOT_FOUND", "Tracked email not found.", 404);
  const clean = validateDraftInput(input);
  await ConnectDB();

  const now = new Date();
  const res = await TrackedEmailModel.updateOne(
    { _id, userId, status: { $in: ["reminder_due", "draft_ready"] } },
    [
      {
        $set: {
          status: "draft_ready",
          draft: {
            // $literal: user text starting with "$" must not be read as a field path.
            to: { $literal: clean.to },
            subject: { $literal: clean.subject },
            body: { $literal: clean.body },
            // Keep the AI flag: the user edited an AI-generated draft.
            aiGenerated: { $ifNull: ["$draft.aiGenerated", false] },
            generatedAt: { $ifNull: ["$draft.generatedAt", null] },
            updatedAt: now,
          },
          followUpHistory: {
            $concatArrays: ["$followUpHistory", [{ type: "draft_saved", at: now }]],
          },
        },
      },
    ],
  );

  if (res.matchedCount === 0) {
    if (!(await findOwned(userId, id))) {
      throw new FollowUpError("NOT_FOUND", "Tracked email not found.", 404);
    }
    throw new FollowUpError("INVALID_STATE", "This follow-up can no longer be edited.", 409);
  }
  return (await getTrackedEmail(userId, id))!;
}

// ─── Snooze / dismiss ─────────────────────────────────────────────────────────

export async function snoozeFollowUp(
  userIdInput: Id,
  id: string,
  input: { days?: number; until?: Date },
  now: Date = new Date(),
): Promise<SerializedTrackedEmail> {
  const userId = oid(userIdInput);
  const _id = oid(id);
  if (!userId || !_id) throw new FollowUpError("NOT_FOUND", "Tracked email not found.", 404);

  let until: Date;
  if (input.until) until = input.until;
  else if (input.days) until = new Date(now.getTime() + input.days * DAY_MS);
  else throw new FollowUpError("INVALID_INPUT", "Provide days or a date.", 400);

  const min = now.getTime() + 60 * 60 * 1000;
  const max = now.getTime() + MAX_SNOOZE_DAYS * DAY_MS;
  if (Number.isNaN(until.getTime()) || until.getTime() < min || until.getTime() > max) {
    throw new FollowUpError(
      "INVALID_INPUT",
      `Pick a reminder date between 1 hour and ${MAX_SNOOZE_DAYS} days from now.`,
      400,
    );
  }

  await ConnectDB();
  const before = (await TrackedEmailModel.findOneAndUpdate(
    { _id, userId, status: { $in: ["reminder_due", "draft_ready"] } },
    {
      $set: { status: "pending", nextFollowUpAt: until, lockedUntil: null, checkFailures: 0 },
      $inc: { reminderCycle: 1 },
      $push: {
        followUpHistory: {
          type: "snoozed",
          at: now,
          note: `Until ${until.toISOString()}`,
        } satisfies IFollowUpEvent,
      },
    },
    { returnDocument: "before" },
  ).lean()) as unknown as TrackedDoc | null;

  if (!before) {
    if (!(await findOwned(userId, id))) {
      throw new FollowUpError("NOT_FOUND", "Tracked email not found.", 404);
    }
    throw new FollowUpError("INVALID_STATE", "This reminder can't be snoozed right now.", 409);
  }

  await markNotificationReadByDedupeKey(userId, reminderDedupeKey(_id, before.reminderCycle)).catch(
    () => false,
  );
  return (await getTrackedEmail(userId, id))!;
}

export async function dismissFollowUp(
  userIdInput: Id,
  id: string,
  now: Date = new Date(),
): Promise<SerializedTrackedEmail> {
  const userId = oid(userIdInput);
  const _id = oid(id);
  if (!userId || !_id) throw new FollowUpError("NOT_FOUND", "Tracked email not found.", 404);
  await ConnectDB();

  const before = (await TrackedEmailModel.findOneAndUpdate(
    { _id, userId, status: { $in: ["pending", "reminder_due", "draft_ready"] } },
    {
      $set: { status: "dismissed", nextFollowUpAt: null, lockedUntil: null },
      $push: { followUpHistory: { type: "dismissed", at: now } satisfies IFollowUpEvent },
    },
    { returnDocument: "before" },
  ).lean()) as unknown as TrackedDoc | null;

  if (!before) {
    if (!(await findOwned(userId, id))) {
      throw new FollowUpError("NOT_FOUND", "Tracked email not found.", 404);
    }
    throw new FollowUpError("INVALID_STATE", "This reminder can't be dismissed right now.", 409);
  }

  await markNotificationReadByDedupeKey(userId, reminderDedupeKey(_id, before.reminderCycle)).catch(
    () => false,
  );
  return (await getTrackedEmail(userId, id))!;
}

// ─── Approved send ────────────────────────────────────────────────────────────

export interface SendFollowUpInput {
  to: string;
  subject: string;
  body: string;
  /** Must be literally `true` — proof the user pressed "Send Email". */
  confirm: boolean;
}

/**
 * Sends the user-approved follow-up through Gmail, inside the original thread.
 *
 * Guarantees:
 *  - requires `confirm === true` (explicit approval) and an owned record;
 *  - atomic claim (`sending`) so retries / double clicks send exactly once;
 *  - success is recorded ONLY after Gmail returns a message id;
 *  - on failure the edited draft is kept and the record returns to
 *    `draft_ready` so the user can retry.
 */
export async function sendApprovedFollowUp(
  userIdInput: Id,
  id: string,
  input: SendFollowUpInput,
  deps: { now?: () => Date } = {},
): Promise<SerializedTrackedEmail> {
  if (input.confirm !== true) {
    throw new FollowUpError("INVALID_INPUT", "Sending requires explicit confirmation.", 400);
  }
  const userId = oid(userIdInput);
  const _id = oid(id);
  if (!userId || !_id) throw new FollowUpError("NOT_FOUND", "Tracked email not found.", 404);
  const clean = validateDraftInput(input);
  await ConnectDB();

  const nowFn = deps.now ?? (() => new Date());
  const start = nowFn();

  // 1. Claim (also persists the approved draft so a failed send keeps it).
  const claimed = (await TrackedEmailModel.findOneAndUpdate(
    {
      _id,
      userId,
      $or: [
        { status: { $in: ["reminder_due", "drafting", "draft_ready"] } },
        {
          status: "sending",
          sendingStartedAt: { $lt: new Date(start.getTime() - SEND_LOCK_MS) },
        },
      ],
    },
    {
      $set: {
        status: "sending",
        sendingStartedAt: start,
        lockedUntil: null,
        draft: {
          to: clean.to,
          subject: clean.subject,
          body: clean.body,
          aiGenerated: false, // replaced below from the stored flag
          generatedAt: null,
          updatedAt: start,
        },
      },
    },
    { returnDocument: "before" },
  ).lean()) as unknown as TrackedDoc | null;

  if (!claimed) {
    const existing = await findOwned(userId, id);
    if (!existing) throw new FollowUpError("NOT_FOUND", "Tracked email not found.", 404);
    if (existing.status === "sending") {
      throw new FollowUpError("SEND_IN_PROGRESS", "This follow-up is already being sent.", 409);
    }
    if (existing.status === "follow_up_sent") {
      throw new FollowUpError("INVALID_STATE", "This follow-up has already been sent.", 409);
    }
    throw new FollowUpError("INVALID_STATE", "This follow-up can't be sent in its current state.", 409);
  }

  // Preserve AI provenance on the stored draft.
  await TrackedEmailModel.updateOne(
    { _id },
    {
      $set: {
        "draft.aiGenerated": claimed.draft?.aiGenerated ?? false,
        "draft.generatedAt": claimed.draft?.generatedAt ?? null,
      },
    },
  );

  const restore = async (event: IFollowUpEvent) => {
    await TrackedEmailModel.updateOne(
      { _id, status: "sending" },
      {
        $set: { status: "draft_ready", sendingStartedAt: null },
        $push: { followUpHistory: event },
      },
    );
  };

  const followUpNumber = claimed.followUpCount + 1;

  try {
    const gmail = await createGmailClientForUser(String(userId));

    // 2. Never follow up on a conversation the recipient has answered.
    const reply = await checkThreadForReply(gmail, claimed);
    if (reply.replied && reply.replyAt) {
      await TrackedEmailModel.updateOne({ _id, status: "sending" }, { $set: { status: "draft_ready" } });
      await markReplied(claimed, { replyAt: reply.replyAt, replyMessageId: reply.replyMessageId });
      throw new FollowUpError(
        "ALREADY_REPLIED",
        "The recipient has already replied, so the follow-up was not sent.",
        409,
      );
    }

    // 3. Threading headers from the original message (best effort).
    let inReplyTo: string | undefined;
    try {
      const orig = await withGmailRetry(() =>
        gmail.users.messages.get({
          userId: "me",
          id: claimed.gmailMessageId,
          format: "metadata",
          metadataHeaders: ["Message-ID", "Message-Id"],
        }),
      );
      inReplyTo = orig.data.payload?.headers?.find(
        (h) => h.name?.toLowerCase() === "message-id",
      )?.value ?? undefined;
    } catch {
      /* threadId alone still keeps it in the conversation */
    }

    const raw = await composeRawEmail({
      from: claimed.senderEmail || "me",
      to: clean.to,
      subject: clean.subject,
      html: clean.body,
      inReplyTo,
      references: inReplyTo,
    });

    // 4. Send — NOT retried automatically: a retry after an ambiguous failure
    //    could deliver the message twice. The user retries explicitly.
    const sent = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw, threadId: claimed.gmailThreadId },
    });

    const messageId = sent.data.id;
    const threadId = sent.data.threadId ?? claimed.gmailThreadId;
    if (!messageId) throw new Error("Gmail did not return a message id");

    // 5. Record success (only now).
    const sentAt = nowFn();
    const nextDays = FOLLOW_UP_SCHEDULE_DAYS[followUpNumber] as number | undefined;
    const update = {
      $set: {
        status: (nextDays ? "pending" : "follow_up_sent") as FollowUpStatus,
        nextFollowUpAt: nextDays ? new Date(sentAt.getTime() + nextDays * DAY_MS) : null,
        followUpCount: followUpNumber,
        lastFollowUpAt: sentAt,
        sendingStartedAt: null,
        lockedUntil: null,
        draft: null,
        lastCheckedAt: sentAt,
      },
      ...(nextDays ? { $inc: { reminderCycle: 1 } } : {}),
      // The approved recipient may differ from the original one; reply
      // detection only trusts senders in this set.
      $addToSet: { monitoredAddresses: { $each: extractEmailAddresses(clean.to) } },
      $push: {
        followUpHistory: {
          type: "follow_up_sent",
          at: sentAt,
          followUpNumber,
          subject: clean.subject,
          body: clean.body,
          gmailMessageId: messageId,
          gmailThreadId: threadId,
        } satisfies IFollowUpEvent,
      },
    };

    try {
      await TrackedEmailModel.updateOne({ _id }, update);
    } catch (dbErr) {
      // Gmail already delivered the message; one more attempt, then surface loudly.
      console.error("[follow-ups] CRITICAL: sent but failed to record", String(_id), (dbErr as Error)?.message);
      await TrackedEmailModel.updateOne({ _id }, update);
    }

    await markNotificationReadByDedupeKey(userId, reminderDedupeKey(_id, claimed.reminderCycle)).catch(
      () => false,
    );
  } catch (err) {
    if (err instanceof FollowUpError) throw err;
    console.error("[follow-ups] send failed:", (err as Error)?.message);
    await restore({
      type: "follow_up_failed",
      at: nowFn(),
      followUpNumber,
      note: ((err as Error)?.message ?? "Send failed").slice(0, 300),
    }).catch((e) => console.error("[follow-ups] failed to restore draft state:", e?.message));
    throw toGmailError(err);
  }

  return (await getTrackedEmail(userId, id))!;
}
