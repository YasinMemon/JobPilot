/**
 * GET /api/ai/usage
 *
 * Returns today's AI usage summary for the authenticated user.
 * Includes credits used, messages sent, tokens consumed, and reset time.
 */

import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import userModel from "@/models/user";
import { getTodayUsageSummary } from "@/services/conversation.service";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await ConnectDB();

    const user = await userModel.findOne({ authUserId: session.user.id }).select("_id").lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const usage = await getTodayUsageSummary(String(user._id));

    return NextResponse.json({ success: true, data: usage });
  } catch (error) {
    console.error("[GET /api/ai/usage] Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
