import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IAIUsageDocument extends Document {
  userId: mongoose.Types.ObjectId;
  /** YYYY-MM-DD format for easy daily lookups */
  date: string;
  messages: number;
  tokensUsed: number;
  creditsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const AIUsageSchema = new Schema<IAIUsageDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      // Format: YYYY-MM-DD
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    messages: {
      type: Number,
      default: 0,
      min: 0,
    },
    tokensUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    creditsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Unique compound index: one record per user per day
AIUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

// ─── Model ────────────────────────────────────────────────────────────────────

const AIUsageModel: Model<IAIUsageDocument> =
  mongoose.models.AIUsage ||
  mongoose.model<IAIUsageDocument>("AIUsage", AIUsageSchema);

export default AIUsageModel;
