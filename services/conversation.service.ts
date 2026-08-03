/**
 * Conversation Service — business logic for conversation lifecycle.
 */

import ConnectDB from "@/lib/db";
import * as repo from "@/repositories/ai.repository";
import userModel from "@/models/user";
import type {
  IConversation,
  IMessage,
  ConversationWithMessages,
  UserAIContext,
  AIAttachment,
  AIToolKey,
  AIActivityType,
} from "@/types/ai";

// ─── User Context ─────────────────────────────────────────────────────────────

/**
 * Fetches and formats the user's profile into an AI context object.
 * Used to personalize every AI request.
 */
export async function buildUserAIContext(
  authUserId: string,
): Promise<UserAIContext> {
  try {
    await ConnectDB();
    const user = await userModel.findOne({ authUserId }).lean();
    if (!user) {
      return { fullName: "User", skills: [] };
    }

    return {
      fullName: user.fullName || "User",
      currentJobTitle: user.currentJobTitle,
      currentRole: user.currentRole,
      skills: user.skills || [],
      yearsOfExperience: user.yearsOfExperience,
      location: user.currentLocation,
      resumeUrl: user.resume,
    };
  } catch {
    return { fullName: "User", skills: [] };
  }
}

// ─── Conversation Lifecycle ───────────────────────────────────────────────────

export async function createNewConversation(
  userId: string,
  title?: string,
): Promise<IConversation> {
  await ConnectDB();
  return repo.createConversation(userId, title || "New Chat");
}

export async function loadConversation(
  conversationId: string,
  userId: string,
): Promise<ConversationWithMessages | null> {
  await ConnectDB();

  const conversation = await repo.getConversationById(conversationId, userId);
  if (!conversation) return null;

  const messages = await repo.getMessagesByConversationId(conversationId, userId);

  return { conversation, messages };
}

export async function getUserConversations(
  userId: string,
): Promise<IConversation[]> {
  await ConnectDB();
  return repo.getConversations(userId);
}

export async function removeConversation(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  await ConnectDB();
  return repo.deleteConversation(conversationId, userId);
}

// ─── Message Persistence ──────────────────────────────────────────────────────

export async function saveUserMessage(params: {
  conversationId: string;
  userId: string;
  content: string;
  attachments?: AIAttachment[];
  toolUsed?: AIToolKey | null;
}): Promise<IMessage> {
  await ConnectDB();
  return repo.createMessage({
    conversationId: params.conversationId,
    userId: params.userId,
    role: "user",
    content: params.content,
    attachments: params.attachments || [],
    toolUsed: params.toolUsed || null,
  });
}

export async function saveAssistantMessage(params: {
  conversationId: string;
  userId: string;
  content: string;
  tokens: number;
  toolUsed?: AIToolKey | null;
}): Promise<IMessage> {
  await ConnectDB();

  // Save message
  const message = await repo.createMessage({
    conversationId: params.conversationId,
    userId: params.userId,
    role: "assistant",
    content: params.content,
    tokens: params.tokens,
    toolUsed: params.toolUsed || null,
  });

  // Update conversation's lastMessage and updatedAt
  const preview = params.content.slice(0, 150).replace(/\n/g, " ");
  await repo.updateConversation(params.conversationId, params.userId, {
    lastMessage: preview,
  });

  return message;
}

// ─── Activity Tracking ────────────────────────────────────────────────────────

export async function trackActivity(params: {
  userId: string;
  type: AIActivityType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await ConnectDB();
    await repo.createActivity(params);
  } catch (err) {
    // Non-blocking — don't fail the request if activity tracking fails
    console.error("[trackActivity] Failed:", err);
  }
}

// ─── Usage ────────────────────────────────────────────────────────────────────

export async function checkAndIncrementUsage(
  userId: string,
  tokensUsed: number,
): Promise<{ allowed: boolean; usage?: Awaited<ReturnType<typeof repo.getTodayUsage>> }> {
  await ConnectDB();

  const allowed = await repo.canUserSendMessage(userId);
  if (!allowed) {
    return { allowed: false };
  }

  const usage = await repo.incrementUsage(userId, tokensUsed);
  return { allowed: true, usage };
}

export async function getTodayUsageSummary(userId: string) {
  await ConnectDB();

  const DAILY_LIMIT = 100;
  const usage = await repo.getTodayUsage(userId);

  const creditsUsed = usage?.creditsUsed || 0;
  const messages = usage?.messages || 0;
  const tokensUsed = usage?.tokensUsed || 0;

  return {
    creditsUsed,
    creditsTotal: DAILY_LIMIT,
    messages,
    tokensUsed,
    creditsRemaining: Math.max(0, DAILY_LIMIT - creditsUsed),
    percentUsed: Math.min(100, Math.round((creditsUsed / DAILY_LIMIT) * 100)),
    resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
  };
}
