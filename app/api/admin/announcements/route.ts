import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { broadcastAnnouncement } from "@/lib/notifications/triggers";

const bodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(1000),
  link: z.string().trim().max(500).optional(),
  /** Re-sending with the same key never notifies anyone twice. */
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
});

/**
 * POST /api/admin/announcements
 * Admin-only: broadcast a platform announcement to every user.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    if ((session.user as { role?: string }).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 },
      );
    }

    const { title, message, link, idempotencyKey } = parsed.data;
    const result = await broadcastAnnouncement({
      announcementId: idempotencyKey ?? randomUUID(),
      title,
      message,
      link,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[POST /api/admin/announcements] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
