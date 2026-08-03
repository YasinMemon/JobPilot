/**
 * GET    /api/ai/conversation/[id] — Get conversation + messages
 * PATCH  /api/ai/conversation/[id] — Rename / pin / archive
 * DELETE /api/ai/conversation/[id] — Delete conversation + messages
 */

import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import userModel from "@/models/user";
import * as conversationSvc from "@/services/conversation.service";
import * as repo from "@/repositories/ai.repository";

async function getInternalUserId(authUserId: string): Promise<string | null> {
  const user = await userModel.findOne({ authUserId }).select("_id").lean();
  return user ? String(user._id) : null;
}

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

// ─── GET /api/ai/conversation/[id] ───────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await ConnectDB();
    const userId = await getInternalUserId(session.user.id);
    if (!userId) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const data = await conversationSvc.loadConversation(id, userId);
    if (!data) {
      return NextResponse.json({ success: false, message: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/ai/conversation/:id] Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/ai/conversation/[id] ─────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await ConnectDB();
    const userId = await getInternalUserId(session.user.id);
    if (!userId) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    }

    const updated = await repo.updateConversation(id, userId, parsed.data);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/ai/conversation/:id] Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/ai/conversation/[id] ────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await ConnectDB();
    const userId = await getInternalUserId(session.user.id);
    if (!userId) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const deleted = await conversationSvc.removeConversation(id, userId);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    console.error("[DELETE /api/ai/conversation/:id] Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
