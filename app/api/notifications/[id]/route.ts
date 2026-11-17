import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireUserId } from "@/lib/notifications/route-auth";
import {
  deleteNotification,
  markNotificationAsRead,
} from "@/services/notification.service";

type RouteContext = { params: Promise<{ id: string }> };

const notFound = () =>
  NextResponse.json(
    { success: false, message: "Notification not found" },
    { status: 404 },
  );

/** PATCH /api/notifications/:id — mark one notification as read. */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID" },
        { status: 400 },
      );
    }

    // A notification owned by another user is indistinguishable from a missing one.
    const ok = await markNotificationAsRead(userId, id);
    return ok ? NextResponse.json({ success: true }) : notFound();
  } catch (error) {
    console.error("[PATCH /api/notifications/:id] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

/** DELETE /api/notifications/:id — delete one notification. */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID" },
        { status: 400 },
      );
    }

    const ok = await deleteNotification(userId, id);
    return ok ? NextResponse.json({ success: true }) : notFound();
  } catch (error) {
    console.error("[DELETE /api/notifications/:id] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
