import mongoose, { Schema, Document, Model } from "mongoose";
import type { AIActivityType } from "@/types/ai";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IAIActivityDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: AIActivityType;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const AIActivitySchema = new Schema<IAIActivityDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "resume",
        "ats",
        "interview",
        "jd",
        "cover_letter",
        "recruiter_message",
        "salary",
        "roadmap",
        "skill_gap",
        "company",
        "chat",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Index for fetching user activities sorted by createdAt DESC
AIActivitySchema.index({ userId: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const AIActivityModel: Model<IAIActivityDocument> =
  mongoose.models.AIActivity ||
  mongoose.model<IAIActivityDocument>("AIActivity", AIActivitySchema);

export default AIActivityModel;
