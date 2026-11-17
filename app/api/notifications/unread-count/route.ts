import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/notifications/route-auth";
import { getUnreadNotificationCount } from "@/services/notification.service";

/** GET /api/notifications/unread-count — lightweight badge endpoint. */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const count = await getUnreadNotificationCount(userId);
    return NextResponse.json(
      { success: true, count },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[GET /api/notifications/unread-count] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
