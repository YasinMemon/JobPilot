import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IAIConversationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  lastMessage: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const AIConversationSchema = new Schema<IAIConversationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: "New Chat",
      maxlength: 200,
    },
    lastMessage: {
      type: String,
      default: "",
      maxlength: 500,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for fetching user's conversations sorted by updatedAt
AIConversationSchema.index({ userId: 1, updatedAt: -1 });
AIConversationSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const AIConversationModel: Model<IAIConversationDocument> =
  mongoose.models.AIConversation ||
  mongoose.model<IAIConversationDocument>("AIConversation", AIConversationSchema);

export default AIConversationModel;
