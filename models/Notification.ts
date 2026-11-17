import mongoose, { Model, Schema } from "mongoose";
import {
  INotification,
  NOTIFICATION_TYPES,
} from "@/types/notifications/type";

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: { type: String, required: true, maxlength: 200, trim: true },
    message: { type: String, required: true, maxlength: 1000, trim: true },
    link: { type: String, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    dedupeKey: { type: String, maxlength: 300 },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/** Newest-first listing per user (cursor-paginated on _id). */
NotificationSchema.index({ userId: 1, _id: -1 });

/** Unread listing + unread count (covered query: userId + isRead). */
NotificationSchema.index({ userId: 1, isRead: 1, _id: -1 });

/**
 * Duplicate prevention. Partial so notifications without a dedupeKey are
 * unrestricted.
 */
NotificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: "string" } },
    name: "notification_dedupe",
  },
);

/** Housekeeping: automatically drop notifications after 180 days. */
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 180, name: "notification_ttl" },
);

const NotificationModel: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default NotificationModel;
