import mongoose, { Model, Schema } from "mongoose";
import {
  FOLLOW_UP_EVENT_TYPES,
  FOLLOW_UP_STATUSES,
  type ITrackedEmail,
} from "@/types/followups/type";

const EventSchema = new Schema(
  {
    type: { type: String, enum: FOLLOW_UP_EVENT_TYPES, required: true },
    at: { type: Date, required: true },
    followUpNumber: { type: Number },
    subject: { type: String, maxlength: 500 },
    body: { type: String, maxlength: 100_000 },
    gmailMessageId: { type: String },
    gmailThreadId: { type: String },
    note: { type: String, maxlength: 500 },
  },
  { _id: false },
);

const DraftSchema = new Schema(
  {
    to: { type: String, required: true, maxlength: 320 },
    subject: { type: String, required: true, maxlength: 500 },
    body: { type: String, required: true, maxlength: 100_000 },
    aiGenerated: { type: Boolean, default: false },
    generatedAt: { type: Date, default: null },
    updatedAt: { type: Date, required: true },
  },
  { _id: false },
);

const TrackedEmailSchema = new Schema<ITrackedEmail>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },

    recipientEmail: { type: String, required: true, lowercase: true, trim: true },
    recipientName: { type: String, default: "" },
    monitoredAddresses: { type: [String], default: [] },
    senderEmail: { type: String, default: "", lowercase: true },

    subject: { type: String, required: true, maxlength: 500 },
    originalBody: { type: String, default: "" },

    gmailMessageId: { type: String, required: true },
    gmailThreadId: { type: String, required: true },
    sentAt: { type: Date, required: true },

    status: { type: String, enum: FOLLOW_UP_STATUSES, default: "pending" },
    nextFollowUpAt: { type: Date, default: null },
    reminderCycle: { type: Number, default: 0 },
    reminderNotificationId: {
      type: Schema.Types.ObjectId,
      ref: "Notification",
      default: null,
    },
    reminderCreatedAt: { type: Date, default: null },

    draft: { type: DraftSchema, default: null },
    followUpCount: { type: Number, default: 0 },
    lastFollowUpAt: { type: Date, default: null },
    followUpHistory: { type: [EventSchema], default: [] },

    replyReceivedAt: { type: Date, default: null },
    lastCheckedAt: { type: Date, default: null },
    checkFailures: { type: Number, default: 0 },
    lastCheckError: { type: String, default: null, maxlength: 500 },

    lockedUntil: { type: Date, default: null },
    sendingStartedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/** Duplicate prevention: one tracking record per sent Gmail message. */
TrackedEmailSchema.index(
  { userId: 1, gmailMessageId: 1 },
  { unique: true, name: "tracked_email_unique_message" },
);

/** Owner listing, newest first, optionally by status. */
TrackedEmailSchema.index({ userId: 1, status: 1, sentAt: -1 });

/** Thread lookup. */
TrackedEmailSchema.index({ gmailThreadId: 1 });

/** Scheduler scan: due records by status. */
TrackedEmailSchema.index({ status: 1, nextFollowUpAt: 1 });

/** Application detail lookup. */
TrackedEmailSchema.index({ userId: 1, applicationId: 1 });

const TrackedEmailModel: Model<ITrackedEmail> =
  mongoose.models.TrackedEmail ||
  mongoose.model<ITrackedEmail>("TrackedEmail", TrackedEmailSchema);

export default TrackedEmailModel;
