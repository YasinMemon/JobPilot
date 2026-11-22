import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { runFollowUpScheduler } from "@/services/followup.scheduler";

// Never cache; always execute on request.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/follow-ups
 *
 * Invoked by Vercel Cron (see vercel.json) with
 * `Authorization: Bearer $CRON_SECRET`. Independent of any browser session.
 *
 *  1. claims tracked emails whose follow-up date has passed;
 *  2. checks the Gmail thread for a genuine recipient reply;
 *  3. cancels the follow-up when replied, otherwise creates one notification;
 *  4. re-checks open reminders / sent follow-ups for late replies.
 *
 * Idempotent and safe to run concurrently or retry (atomic claims +
 * notification dedupe keys).
 */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = await runFollowUpScheduler();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[GET /api/cron/follow-ups] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
