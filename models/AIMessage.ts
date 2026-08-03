import mongoose, { Schema, Document, Model } from "mongoose";
import type { AIMessageRole, AIToolKey } from "@/types/ai";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface AIAttachmentSubDoc {
  fileId: string;
  url: string;
  fileName: string;
  attachmentType: "resume" | "jd" | "other";
  textContent?: string;
  mimeType: string;
  size: number;
}

export interface IAIMessageDocument extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: AIMessageRole;
  content: string;
  attachments: AIAttachmentSubDoc[];
  toolUsed?: AIToolKey | null;
  tokens: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-Schema ───────────────────────────────────────────────────────────────

const AttachmentSchema = new Schema<AIAttachmentSubDoc>(
  {
    fileId: { type: String, required: true },
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    attachmentType: {
      type: String,
      enum: ["resume", "jd", "other"],
      default: "other",
    },
    textContent: { type: String },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false },
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const AIMessageSchema = new Schema<IAIMessageDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "AIConversation",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    toolUsed: {
      type: String,
      enum: [
        "resume",
        "ats",
        "interview",
        "jd",
        "cover-letter",
        "recruiter-message",
        "salary",
        "roadmap",
        "skill-gap",
        "company",
        null,
      ],
      default: null,
    },
    tokens: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Index for fetching messages in a conversation sorted by createdAt
AIMessageSchema.index({ conversationId: 1, createdAt: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const AIMessageModel: Model<IAIMessageDocument> =
  mongoose.models.AIMessage ||
  mongoose.model<IAIMessageDocument>("AIMessage", AIMessageSchema);

export default AIMessageModel;
