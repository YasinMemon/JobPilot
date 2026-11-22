import mongoose from "mongoose";
import ConnectDB from "@/lib/db";
import NotificationModel from "@/models/Notification";
import type {
  INotification,
  Notification,
  NotificationType,
} from "@/types/notifications/type";

/**
 * Server-side notification service.
 *
 * Independent of any UI or route: every function takes the owning `userId`
 * explicitly and scopes every query by it, so a caller that passes the
 * session user id can never read or mutate another user's notifications.
 */

type UserIdInput = string | mongoose.Types.ObjectId;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toObjectId(value: UserIdInput): mongoose.Types.ObjectId | null {
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
}

/** Only same-origin, in-app paths are allowed as notification links. */
export function sanitizeLink(link?: string | null): string | undefined {
  if (!link) return undefined;
  if (!link.startsWith("/") || link.startsWith("//")) return undefined;
  return link.slice(0, 500);
}

export function serializeNotification(
  doc: Pick<
    INotification,
    | "type"
    | "title"
    | "message"
    | "link"
    | "metadata"
    | "isRead"
    | "readAt"
    | "createdAt"
  > & { _id: { toString(): string } },
): Notification {
  return {
    id: doc._id.toString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    link: doc.link || undefined,
    metadata: doc.metadata ?? {},
    isRead: doc.isRead,
    readAt: doc.readAt ? new Date(doc.readAt).toISOString() : null,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: number }).code === 11000
  );
}

// ─── Create ───────────────────────────────────────────────────────────────────

export interface CreateNotificationInput {
  userId: UserIdInput;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  /**
   * Stable key describing the event (e.g. `status:<appId>:<from>:<to>:<ts>`).
   * A second call with the same key for the same user is ignored.
   */
  dedupeKey?: string;
}

export interface CreateNotificationResult {
  created: boolean;
  notification: Notification | null;
}

/**
 * Persist a notification. Returns `created: false` (without throwing) when a
 * notification with the same `dedupeKey` already exists for the user.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<CreateNotificationResult> {
  const userId = toObjectId(input.userId);
  if (!userId) throw new Error("createNotification: invalid userId");

  await ConnectDB();

  try {
    const doc = await NotificationModel.create({
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: sanitizeLink(input.link),
      metadata: input.metadata ?? {},
      dedupeKey: input.dedupeKey,
    });
    return { created: true, notification: serializeNotification(doc) };
  } catch (err) {
    if (isDuplicateKeyError(err)) return { created: false, notification: null };
    throw err;
  }
}

/**
 * Create the same notification for many users (e.g. announcements).
 * Idempotent per user through `dedupeKey` (required here).
 */
export async function createNotificationForUsers(
  userIds: UserIdInput[],
  input: Omit<CreateNotificationInput, "userId" | "dedupeKey"> & {
    dedupeKey: string;
  },
): Promise<{ created: number }> {
  const ids = userIds
    .map(toObjectId)
    .filter((id): id is mongoose.Types.ObjectId => id !== null);
  if (ids.length === 0) return { created: 0 };

  await ConnectDB();

  const now = new Date();
  const CHUNK = 500;
  let created = 0;

  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    const result = await NotificationModel.bulkWrite(
      slice.map((userId) => ({
        updateOne: {
          filter: { userId, dedupeKey: input.dedupeKey },
          update: {
            $setOnInsert: {
              userId,
              type: input.type,
              title: input.title,
              message: input.message,
              link: sanitizeLink(input.link),
              metadata: input.metadata ?? {},
              isRead: false,
              readAt: null,
              dedupeKey: input.dedupeKey,
              createdAt: now,
              updatedAt: now,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false, timestamps: false },
    );
    created += result.upsertedCount;
  }

  return { created };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export interface GetUserNotificationsOptions {
  limit?: number;
  /** `id` of the last item of the previous page. */
  cursor?: string | null;
  unreadOnly?: boolean;
}

export interface GetUserNotificationsResult {
  items: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Cursor-paginated (newest first) notifications for a user. Cursor pagination
 * stays correct while items are inserted or deleted between page loads.
 */
export async function getUserNotifications(
  userIdInput: UserIdInput,
  options: GetUserNotificationsOptions = {},
): Promise<GetUserNotificationsResult> {
  const userId = toObjectId(userIdInput);
  if (!userId) return { items: [], nextCursor: null, hasMore: false };

  const limit = Math.min(
    Math.max(Math.trunc(options.limit ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE,
  );

  const filter: Record<string, unknown> = { userId };
  if (options.unreadOnly) filter.isRead = false;
  if (options.cursor) {
    if (!mongoose.Types.ObjectId.isValid(options.cursor)) {
      throw new Error("Invalid cursor");
    }
    filter._id = { $lt: new mongoose.Types.ObjectId(options.cursor) };
  }

  await ConnectDB();

  // Fetch one extra row to know whether another page exists.
  const rows = await NotificationModel.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const items = page.map((r) =>
    serializeNotification(r as unknown as Parameters<typeof serializeNotification>[0]),
  );

  return {
    items,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

/** Cheap index-covered count used by the bell badge. */
export async function getUnreadNotificationCount(
  userIdInput: UserIdInput,
): Promise<number> {
  const userId = toObjectId(userIdInput);
  if (!userId) return 0;
  await ConnectDB();
  return NotificationModel.countDocuments({ userId, isRead: false });
}

// ─── Update / delete ──────────────────────────────────────────────────────────

/**
 * Mark one notification read. Returns false when it does not exist or belongs
 * to somebody else (callers should answer 404 in both cases).
 */
export async function markNotificationAsRead(
  userIdInput: UserIdInput,
  notificationId: string,
): Promise<boolean> {
  const userId = toObjectId(userIdInput);
  if (!userId || !mongoose.Types.ObjectId.isValid(notificationId)) return false;

  await ConnectDB();

  // Keep the original readAt if it was already read.
  const result = await NotificationModel.updateOne(
    { _id: notificationId, userId },
    [
      {
        $set: {
          readAt: { $cond: [{ $eq: ["$isRead", true] }, "$readAt", "$$NOW"] },
          isRead: true,
        },
      },
    ],
  );
  return result.matchedCount > 0;
}

/** Mark every unread notification of the user as read. Returns how many changed. */
export async function markAllNotificationsAsRead(
  userIdInput: UserIdInput,
): Promise<number> {
  const userId = toObjectId(userIdInput);
  if (!userId) return 0;

  await ConnectDB();

  const result = await NotificationModel.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );
  return result.modifiedCount;
}

/** Delete one notification. Returns false when missing or not owned by the user. */
export async function deleteNotification(
  userIdInput: UserIdInput,
  notificationId: string,
): Promise<boolean> {
  const userId = toObjectId(userIdInput);
  if (!userId || !mongoose.Types.ObjectId.isValid(notificationId)) return false;

  await ConnectDB();

  const result = await NotificationModel.deleteOne({
    _id: notificationId,
    userId,
  });
  return result.deletedCount > 0;
}

// ─── By dedupe key (used to resolve system-generated notifications) ──────────

/** Delete a notification identified by its dedupe key. Scoped to the owner. */
export async function deleteNotificationByDedupeKey(
  userIdInput: UserIdInput,
  dedupeKey: string,
): Promise<boolean> {
  const userId = toObjectId(userIdInput);
  if (!userId || !dedupeKey) return false;
  await ConnectDB();
  const result = await NotificationModel.deleteOne({ userId, dedupeKey });
  return result.deletedCount > 0;
}

/** Mark a notification (identified by dedupe key) as read. */
export async function markNotificationReadByDedupeKey(
  userIdInput: UserIdInput,
  dedupeKey: string,
): Promise<boolean> {
  const userId = toObjectId(userIdInput);
  if (!userId || !dedupeKey) return false;
  await ConnectDB();
  const result = await NotificationModel.updateOne(
    { userId, dedupeKey, isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );
  return result.matchedCount > 0;
}
