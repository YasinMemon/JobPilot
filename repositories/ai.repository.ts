/**
 * AI Repository — database access layer.
 *
 * All MongoDB queries for the AI feature are centralized here.
 * Services import from this file; API routes import from services.
 */

import mongoose from "mongoose";
import AIConversationModel from "@/models/AIConversation";
import AIMessageModel from "@/models/AIMessage";
import AIActivityModel from "@/models/AIActivity";
import AIUsageModel from "@/models/AIUsage";
import type {
  IConversation,
  IMessage,
  IActivity,
  IUsage,
  AIActivityType,
  AIToolKey,
  AIAttachment,
  UpdateConversationPayload,
} from "@/types/ai";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

function todayDate(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

// ─── Serializers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeConversation(doc: any): IConversation {
  return {
    _id: String(doc._id),
    userId: String(doc.userId),
    title: doc.title,
    lastMessage: doc.lastMessage || "",
    isPinned: doc.isPinned,
    isArchived: doc.isArchived,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeMessage(doc: any): IMessage {
  return {
    _id: String(doc._id),
    conversationId: String(doc.conversationId),
    userId: String(doc.userId),
    role: doc.role,
    content: doc.content,
    attachments: doc.attachments || [],
    toolUsed: doc.toolUsed || null,
    tokens: doc.tokens || 0,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeActivity(doc: any): IActivity {
  return {
    _id: String(doc._id),
    userId: String(doc.userId),
    type: doc.type,
    title: doc.title,
    description: doc.description,
    metadata: doc.metadata || {},
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeUsage(doc: any): IUsage {
  return {
    _id: String(doc._id),
    userId: String(doc.userId),
    date: doc.date,
    messages: doc.messages,
    tokensUsed: doc.tokensUsed,
    creditsUsed: doc.creditsUsed,
  };
}

// ─── Conversation Repo ────────────────────────────────────────────────────────

export async function createConversation(
  userId: string,
  title = "New Chat",
): Promise<IConversation> {
  const doc = await AIConversationModel.create({
    userId: toObjectId(userId),
    title,
    lastMessage: "",
    isPinned: false,
    isArchived: false,
  });
  return serializeConversation(doc);
}

export async function getConversations(userId: string): Promise<IConversation[]> {
  const docs = await AIConversationModel.find({
    userId: toObjectId(userId),
    isArchived: false,
  })
    .sort({ isPinned: -1, updatedAt: -1 })
    .limit(50)
    .lean();
  return docs.map(serializeConversation);
}

export async function getConversationById(
  id: string,
  userId: string,
): Promise<IConversation | null> {
  const doc = await AIConversationModel.findOne({
    _id: toObjectId(id),
    userId: toObjectId(userId),
  }).lean();
  return doc ? serializeConversation(doc) : null;
}

export async function updateConversation(
  id: string,
  userId: string,
  updates: UpdateConversationPayload & { lastMessage?: string },
): Promise<IConversation | null> {
  const doc = await AIConversationModel.findOneAndUpdate(
    { _id: toObjectId(id), userId: toObjectId(userId) },
    { $set: updates },
    { new: true },
  ).lean();
  return doc ? serializeConversation(doc) : null;
}

export async function deleteConversation(id: string, userId: string): Promise<boolean> {
  const result = await AIConversationModel.deleteOne({
    _id: toObjectId(id),
    userId: toObjectId(userId),
  });
  if (result.deletedCount > 0) {
    // Also delete all messages
    await AIMessageModel.deleteMany({ conversationId: toObjectId(id) });
    return true;
  }
  return false;
}

// ─── Message Repo ─────────────────────────────────────────────────────────────

export async function createMessage(params: {
  conversationId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: AIAttachment[];
  toolUsed?: AIToolKey | null;
  tokens?: number;
}): Promise<IMessage> {
  const doc = await AIMessageModel.create({
    conversationId: toObjectId(params.conversationId),
    userId: toObjectId(params.userId),
    role: params.role,
    content: params.content,
    attachments: params.attachments || [],
    toolUsed: params.toolUsed || null,
    tokens: params.tokens || 0,
  });
  return serializeMessage(doc);
}

export async function getMessagesByConversationId(
  conversationId: string,
  userId: string,
  limit = 50,
): Promise<IMessage[]> {
  const docs = await AIMessageModel.find({
    conversationId: toObjectId(conversationId),
    userId: toObjectId(userId),
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
  return docs.map(serializeMessage);
}

/** Returns last N messages for AI context (excludes system messages) */
export async function getRecentMessagesForContext(
  conversationId: string,
  limit = 20,
): Promise<{ role: string; content: string }[]> {
  const docs = await AIMessageModel.find({
    conversationId: toObjectId(conversationId),
    role: { $ne: "system" },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("role content")
    .lean();
  return docs.reverse().map((d) => ({ role: d.role, content: d.content }));
}

// ─── Activity Repo ────────────────────────────────────────────────────────────

export async function createActivity(params: {
  userId: string;
  type: AIActivityType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}): Promise<IActivity> {
  const doc = await AIActivityModel.create({
    userId: toObjectId(params.userId),
    type: params.type,
    title: params.title,
    description: params.description,
    metadata: params.metadata || {},
  });
  return serializeActivity(doc);
}

export async function getActivities(userId: string, limit = 10): Promise<IActivity[]> {
  const docs = await AIActivityModel.find({ userId: toObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(serializeActivity);
}

// ─── Usage Repo ───────────────────────────────────────────────────────────────

export async function getTodayUsage(userId: string): Promise<IUsage | null> {
  const doc = await AIUsageModel.findOne({
    userId: toObjectId(userId),
    date: todayDate(),
  }).lean();
  return doc ? serializeUsage(doc) : null;
}

export async function incrementUsage(
  userId: string,
  tokensUsed: number,
): Promise<IUsage> {
  const doc = await AIUsageModel.findOneAndUpdate(
    { userId: toObjectId(userId), date: todayDate() },
    {
      $inc: {
        messages: 1,
        tokensUsed,
        creditsUsed: 1,
      },
    },
    {
      upsert: true,
      new: true,
    },
  ).lean();
  return serializeUsage(doc!);
}

export async function canUserSendMessage(
  userId: string,
  dailyLimit = 100,
): Promise<boolean> {
  const usage = await getTodayUsage(userId);
  if (!usage) return true;
  return usage.creditsUsed < dailyLimit;
}
