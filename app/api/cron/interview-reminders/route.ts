import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import ConnectDB from "@/lib/db";
import ApplicationModel from "@/models/applications";
import { ApplicationStatus } from "@/types/applications/type";
import {
  notifyInterviewReminder,
  type ReminderWindow,
} from "@/lib/notifications/triggers";

// Never cache; always execute on request.
export const dynamic = "force-dynamic";

const HOUR = 60 * 60 * 1000;
const BATCH_LIMIT = 1000;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed when not configured

  const header = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * GET /api/cron/interview-reminders
 *
 * Meant to be invoked by an external scheduler every ~15 minutes with
 * `Authorization: Bearer $CRON_SECRET` (Vercel Cron does this automatically
 * when CRON_SECRET is set). It does not depend on any open browser tab.
 *
 *  - interviews starting in (now, now+1h]      → "1h" reminder
 *  - interviews starting in (now+1h, now+24h]  → "24h" reminder
 *
 * Idempotent: each (application, interview time, window) reminder is
 * protected by a unique dedupe key, so overlapping runs or retries never
 * notify twice.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    await ConnectDB();

    const now = Date.now();
    const upcoming = await ApplicationModel.find(
      {
        interviewAt: { $gt: new Date(now), $lte: new Date(now + 24 * HOUR) },
        status: { $nin: [ApplicationStatus.REJECTED, ApplicationStatus.HIRED] },
      },
      { userId: 1, company: 1, position: 1, interviewAt: 1 },
    )
      .sort({ interviewAt: 1 })
      .limit(BATCH_LIMIT)
      .lean();

    let sent = 0;
    let failed = 0;

    for (const app of upcoming) {
      const interviewAt = new Date(app.interviewAt as Date);
      const window: ReminderWindow =
        interviewAt.getTime() - now <= HOUR ? "1h" : "24h";
      try {
        const created = await notifyInterviewReminder(
          app.userId,
          {
            id: String(app._id),
            company: app.company,
            position: app.position,
          },
          interviewAt,
          window,
        );
        if (created) sent++;
      } catch (err) {
        failed++;
        console.error("[cron/interview-reminders] failed for", String(app._id), err);
      }
    }

    return NextResponse.json({
      success: true,
      checked: upcoming.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("[GET /api/cron/interview-reminders] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
