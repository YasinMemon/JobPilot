import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/notifications/route-auth";
import { getUserNotifications } from "@/services/notification.service";

/**
 * GET /api/notifications?limit=20&cursor=<id>&unreadOnly=true
 * Cursor-paginated notifications of the authenticated user (newest first).
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const sp = req.nextUrl.searchParams;
    const cursor = sp.get("cursor");
    const limit = Number(sp.get("limit") ?? "") || undefined;

    const result = await getUserNotifications(userId, {
      limit,
      cursor,
      unreadOnly: sp.get("unreadOnly") === "true",
    });

    return NextResponse.json(
      {
        success: true,
        data: result.items,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid cursor") {
      return NextResponse.json(
        { success: false, message: "Invalid cursor" },
        { status: 400 },
      );
    }
    console.error("[GET /api/notifications] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
