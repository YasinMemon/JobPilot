import {
  ApplicationStatus,
  IApplication,
  IAttachment,
} from "@/types/applications/type";
import mongoose, { Model, Schema } from "mongoose";

// ─── Attachment Sub-schema ────────────────────────────────────────────────────

const AttachmentSchema = new Schema<IAttachment>(
  {
    filename: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
    },
  },
  {
    _id: false,
  },
);

// ─── Application Schema ───────────────────────────────────────────────────────

const ApplicationSchema = new Schema<IApplication>(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    gmailMessageId: {
      type: String,
      required: true,
    },

    threadId: {
      type: String,
      required: true,
    },

    // ── Company ───────────────────────────────────────────────────────────────
    company: {
      type: String,
      default: "",
      index: true,
    },

    companyLogo: {
      type: String,
      default: "",
    },

    position: {
      type: String,
      default: "",
      index: true,
    },

    // ── Contact Info ──────────────────────────────────────────────────────────
    recruiterEmail: {
      type: String,
      default: "",
    },

    candidateEmail: {
      type: String,
      default: "",
    },

    // ── Job Details ───────────────────────────────────────────────────────────
    location: {
      type: String,
      default: "",
    },

    salary: {
      type: String,
      default: "",
    },

    platform: {
      type: String,
      default: "",
    },

    appliedVia: {
      type: String,
      default: "",
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.UNKNOWN,
      index: true,
    },

    // ── Email Fields ──────────────────────────────────────────────────────────
    subject: {
      type: String,
      required: true,
    },

    from: {
      type: String,
      required: true,
    },

    snippet: {
      type: String,
      default: "",
    },

    fullEmail: {
      type: String,
      default: "",
    },

    // ── AI Fields ─────────────────────────────────────────────────────────────
    aiSummary: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    // ── Labels ────────────────────────────────────────────────────────────────
    labels: {
      type: [String],
      default: [],
    },

    // ── Attachments ───────────────────────────────────────────────────────────
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },

    // ── Dates ─────────────────────────────────────────────────────────────────
    applicationDate: {
      type: Date,
    },

    interviewAt: {
      type: Date,
      default: null,
    },

    receivedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * Prevent duplicate applications.
 * One Gmail message = One Application.
 */
ApplicationSchema.index(
  {
    userId: 1,
    gmailMessageId: 1,
  },
  {
    unique: true,
  },
);

/**
 * Lets the reminder job find upcoming interviews without a collection scan.
 * Partial: only applications that actually have an interview scheduled.
 */
ApplicationSchema.index(
  { interviewAt: 1 },
  {
    name: "application_interview_upcoming",
    partialFilterExpression: { interviewAt: { $type: "date" } },
  },
);

/**
 * Compound text index for search on company name, position, and sender email.
 */
ApplicationSchema.index(
  {
    company: "text",
    position: "text",
    from: "text",
    recruiterEmail: "text",
    candidateEmail: "text",
  },
  {
    name: "application_text_search",
    weights: {
      company: 10,
      position: 8,
      from: 5,
      recruiterEmail: 3,
      candidateEmail: 3,
    },
  },
);

// ─── Model ────────────────────────────────────────────────────────────────────

const ApplicationModel: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);

export default ApplicationModel;
