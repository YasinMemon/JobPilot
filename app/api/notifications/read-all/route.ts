import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/notifications/route-auth";
import { markAllNotificationsAsRead } from "@/services/notification.service";

/** POST /api/notifications/read-all — mark all of the user's notifications read. */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const updated = await markAllNotificationsAsRead(userId);
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("[POST /api/notifications/read-all] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
