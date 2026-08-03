/**
 * GET  /api/ai/conversations — List user's conversations
 * POST /api/ai/conversations — Create a new conversation
 */

import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import userModel from "@/models/user";
import * as conversationSvc from "@/services/conversation.service";

async function getInternalUserId(authUserId: string): Promise<string | null> {
  const user = await userModel.findOne({ authUserId }).select("_id").lean();
  return user ? String(user._id) : null;
}

// ─── GET /api/ai/conversations ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await ConnectDB();
    const userId = await getInternalUserId(session.user.id);
    if (!userId) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const conversations = await conversationSvc.getUserConversations(userId);

    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    console.error("[GET /api/ai/conversations] Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/ai/conversations ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await ConnectDB();
    const userId = await getInternalUserId(session.user.id);
    if (!userId) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === "string" ? body.title.slice(0, 200) : "New Chat";

    const conversation = await conversationSvc.createNewConversation(userId, title);

    return NextResponse.json({ success: true, data: conversation }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/ai/conversations] Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
