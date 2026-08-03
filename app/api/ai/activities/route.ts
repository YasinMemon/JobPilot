/**
 * GET /api/ai/activities
 *
 * Returns the latest AI activities for the authenticated user.
 * Query params:
 *   limit — number of activities to return (default: 10, max: 50)
 */

import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import userModel from "@/models/user";
import * as repo from "@/repositories/ai.repository";

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

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    const activities = await repo.getActivities(String(user._id), limit);

    return NextResponse.json({ success: true, data: activities });
  } catch (error) {
    console.error("[GET /api/ai/activities] Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
