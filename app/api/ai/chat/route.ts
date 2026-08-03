/**
 * POST /api/ai/chat
 *
 * Streams an AI response token-by-token using Groq.
 * Creates/updates conversations, saves messages, tracks usage and activities.
 *
 * Request body:
 *   conversationId? — existing conversation ID (omit to start new chat)
 *   message         — user message text
 *   tool?           — AI tool key (resume, interview, etc.)
 *   attachments?    — file attachment metadata array
 */

import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as conversationSvc from "@/services/conversation.service";
import { streamChatCompletion, generateConversationTitle } from "@/services/ai.service";
import * as repo from "@/repositories/ai.repository";
import userModel from "@/models/user";
import type { AIToolKey, AIActivityType } from "@/types/ai";

// ─── Validation ───────────────────────────────────────────────────────────────

const ChatRequestSchema = z.object({
  conversationId: z.string().nullish(), // null when starting a new chat
  message: z.string().min(1, "Message cannot be empty").max(8000, "Message too long"),
  tool: z
    .enum([
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
    ])
    .nullish(), // null when no specific tool is selected
  attachments: z
    .array(
      z.object({
        fileId: z.string(),
        url: z.string().url(),
        fileName: z.string(),
        attachmentType: z.enum(["resume", "jd", "other"]).default("other"),
        textContent: z.string().optional(),
        mimeType: z.string(),
        size: z.number(),
      }),
    )
    .optional()
    .default([]),
});

// ─── Tool → Activity type mapping ─────────────────────────────────────────────

const TOOL_TO_ACTIVITY: Record<AIToolKey, AIActivityType> = {
  resume: "resume",
  ats: "ats",
  interview: "interview",
  jd: "jd",
  "cover-letter": "cover_letter",
  "recruiter-message": "recruiter_message",
  salary: "salary",
  roadmap: "roadmap",
  "skill-gap": "skill_gap",
  company: "company",
};

const TOOL_ACTIVITY_TITLES: Record<AIToolKey, string> = {
  resume: "Resume analyzed",
  ats: "ATS score calculated",
  interview: "Interview session completed",
  jd: "Job description analyzed",
  "cover-letter": "Cover letter created",
  "recruiter-message": "Recruiter message generated",
  salary: "Salary insights generated",
  roadmap: "Career roadmap created",
  "skill-gap": "Skill gap analysis done",
  company: "Company research completed",
};

// ─── Sanitize prompt ──────────────────────────────────────────────────────────

function sanitizeMessage(message: string): string {
  // Remove any attempt to inject system-level commands
  return message
    .replace(/\[INST\]|\[\/INST\]|<\|system\|>|<\|user\|>|<\|assistant\|>/gi, "")
    .trim();
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const authUserId = session.user.id;
    await ConnectDB();

    // ── Get internal userId from User model ───────────────────────────────────
    const userDoc = await userModel.findOne({ authUserId }).select("_id").lean();
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 404 },
      );
    }
    const userId = String(userDoc._id);

    // ── Check rate limit ──────────────────────────────────────────────────────
    const canSend = await repo.canUserSendMessage(userId);
    if (!canSend) {
      return NextResponse.json(
        {
          success: false,
          message: "Daily limit reached. Your credits reset at midnight.",
        },
        { status: 429 },
      );
    }

    // ── Parse & validate body ─────────────────────────────────────────────────
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 },
      );
    }

    const { message, attachments } = parsed.data;
    // Normalize null → undefined for downstream type compatibility
    const tool = (parsed.data.tool ?? undefined) as import("@/types/ai").AIToolKey | undefined;
    let conversationId = (parsed.data.conversationId ?? undefined) as string | undefined;

    const sanitizedMessage = sanitizeMessage(message);

    // ── Build user context ────────────────────────────────────────────────────
    const userContext = await conversationSvc.buildUserAIContext(authUserId);

    // ── Upsert conversation ───────────────────────────────────────────────────
    const isNewConversation = !conversationId;

    if (!conversationId) {
      const conv = await conversationSvc.createNewConversation(userId, "New Chat");
      conversationId = conv._id;
    } else {
      // Verify ownership
      const conv = await repo.getConversationById(conversationId, userId);
      if (!conv) {
        return NextResponse.json(
          { success: false, message: "Conversation not found" },
          { status: 404 },
        );
      }
    }

    // ── Save user message ─────────────────────────────────────────────────────
    await conversationSvc.saveUserMessage({
      conversationId,
      userId,
      content: sanitizedMessage,
      attachments,
      toolUsed: tool,
    });

    // ── Load conversation history for context ─────────────────────────────────
    const contextMessages = await repo.getRecentMessagesForContext(conversationId, 20);

    // Build messages for AI (include attachment context in content)
    const attachmentContext =
      attachments && attachments.length > 0
        ? "\n\n[Attached files: " +
          attachments
            .map((a) =>
              a.textContent
                ? `${a.fileName} (${a.attachmentType}): ${a.textContent.slice(0, 2000)}`
                : `${a.fileName} (${a.attachmentType})`,
            )
            .join("\n") +
          "]"
        : "";

    const aiMessages: import("@/types/ai").GroqMessage[] = [
      ...(contextMessages.slice(0, -1) as import("@/types/ai").GroqMessage[]),
      {
        role: "user" as const,
        content: sanitizedMessage + attachmentContext,
      },
    ];

    // ── Stream response ───────────────────────────────────────────────────────
    let fullContent = "";
    let tokenCount = 0;
    const encoder = new TextEncoder();

    const { stream: groqStream } = await streamChatCompletion({
      messages: aiMessages,
      tool,
      userContext,
    });

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = groqStream.getReader();

        // Emit the conversationId as first chunk so client knows which conversation
        const metaChunk = `data: ${JSON.stringify({ conversationId, isNew: isNewConversation })}\n\n`;
        controller.enqueue(encoder.encode(metaChunk));

        try {
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            fullContent += text;
            tokenCount += Math.ceil(text.length / 4); // rough estimate

            // Stream token
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: text })}\n\n`));
          }
        } finally {
          reader.releaseLock();
        }

        // ── Post-stream: save assistant message, update usage, create activity ──
        try {
          // Save assistant message
          await conversationSvc.saveAssistantMessage({
            conversationId: conversationId!,
            userId,
            content: fullContent,
            tokens: tokenCount,
            toolUsed: tool,
          });

          // Generate title for new conversations (background, don't await in stream)
          if (isNewConversation) {
            generateConversationTitle(sanitizedMessage)
              .then((title) =>
                repo.updateConversation(conversationId!, userId, { title }),
              )
              .catch(console.error);
          }

          // Increment usage
          await repo.incrementUsage(userId, tokenCount);

          // Create activity if a tool was used
          if (tool) {
            await conversationSvc.trackActivity({
              userId,
              type: TOOL_TO_ACTIVITY[tool],
              title: TOOL_ACTIVITY_TITLES[tool],
              description: sanitizedMessage.slice(0, 150),
              metadata: { conversationId, tool },
            });
          }

          // Signal completion
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, conversationId })}\n\n`,
            ),
          );
        } catch (err) {
          console.error("[POST /api/ai/chat] Post-stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Failed to save response" })}\n\n`,
            ),
          );
        }

        controller.close();
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[POST /api/ai/chat] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
