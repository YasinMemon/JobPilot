/**
 * POST /api/ai/tools/[tool]
 *
 * Specialized AI tool endpoints. Each tool uses its own system prompt
 * and streams the response exactly like the main chat endpoint.
 *
 * Supported tools:
 *   resume, ats, interview, jd, cover-letter,
 *   recruiter-message, salary, roadmap, skill-gap, company
 */

import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import userModel from "@/models/user";
import * as conversationSvc from "@/services/conversation.service";
import { streamChatCompletion } from "@/services/ai.service";
import * as repo from "@/repositories/ai.repository";
import type { AIToolKey, AIActivityType } from "@/types/ai";

// ─── Valid tools ──────────────────────────────────────────────────────────────

const VALID_TOOLS: AIToolKey[] = [
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
];

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

// ─── Request schema ───────────────────────────────────────────────────────────

const ToolRequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(8000),
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

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tool: string }> },
) {
  try {
    const { tool: toolParam } = await params;

    // Validate tool
    if (!VALID_TOOLS.includes(toolParam as AIToolKey)) {
      return NextResponse.json(
        { success: false, message: `Unknown tool: ${toolParam}` },
        { status: 400 },
      );
    }
    const tool = toolParam as AIToolKey;

    // Auth
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await ConnectDB();
    const userDoc = await userModel.findOne({ authUserId: session.user.id }).select("_id").lean();
    if (!userDoc) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    const userId = String(userDoc._id);

    // Rate limit
    const canSend = await repo.canUserSendMessage(userId);
    if (!canSend) {
      return NextResponse.json(
        { success: false, message: "Daily limit reached. Credits reset at midnight." },
        { status: 429 },
      );
    }

    // Parse body
    const body = await req.json();
    const parsed = ToolRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    }

    const { message, attachments } = parsed.data;
    let { conversationId } = parsed.data;

    // Build user context
    const userContext = await conversationSvc.buildUserAIContext(session.user.id);

    // Upsert conversation
    const isNew = !conversationId;
    if (!conversationId) {
      const conv = await conversationSvc.createNewConversation(userId, "New Chat");
      conversationId = conv._id;
    }

    // Save user message
    await conversationSvc.saveUserMessage({
      conversationId,
      userId,
      content: message,
      attachments,
      toolUsed: tool,
    });

    // Attachment context
    const attachmentContext =
      attachments && attachments.length > 0
        ? "\n\n[Attached: " +
          attachments.map((a) =>
            a.textContent ? `${a.fileName}: ${a.textContent.slice(0, 2000)}` : a.fileName
          ).join(", ") + "]"
        : "";

    // Stream response
    let fullContent = "";
    let tokenCount = 0;
    const encoder = new TextEncoder();

    const { stream: groqStream } = await streamChatCompletion({
      messages: [{ role: "user", content: message + attachmentContext }],
      tool,
      userContext,
    });

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Emit meta first
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ conversationId, isNew })}\n\n`),
        );

        const reader = groqStream.getReader();
        try {
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            fullContent += text;
            tokenCount += Math.ceil(text.length / 4);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: text })}\n\n`));
          }
        } finally {
          reader.releaseLock();
        }

        // Post-stream: save + usage + activity
        try {
          await conversationSvc.saveAssistantMessage({
            conversationId: conversationId!,
            userId,
            content: fullContent,
            tokens: tokenCount,
            toolUsed: tool,
          });

          if (isNew) {
            const { generateConversationTitle } = await import("@/services/ai.service");
            generateConversationTitle(message)
              .then((title) => repo.updateConversation(conversationId!, userId, { title }))
              .catch(console.error);
          }

          await repo.incrementUsage(userId, tokenCount);

          await conversationSvc.trackActivity({
            userId,
            type: TOOL_TO_ACTIVITY[tool],
            title: TOOL_ACTIVITY_TITLES[tool],
            description: message.slice(0, 150),
            metadata: { conversationId, tool },
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, conversationId })}\n\n`),
          );
        } catch (err) {
          console.error("[tools] Post-stream error:", err);
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
    console.error("[POST /api/ai/tools/:tool] Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
