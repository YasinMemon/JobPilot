import { NextRequest, NextResponse } from "next/server";
import { errorResponse, noStore, requireFollowUpUser } from "@/lib/followups/route";
import { getFollowUpSummary, listTrackedEmails } from "@/services/followup.service";
import { FOLLOW_UP_STATUSES, type FollowUpStatus } from "@/types/followups/type";

/**
 * GET /api/follow-ups?status=pending,reminder_due&applicationId=&limit=&skip=
 * Tracked emails of the authenticated user (newest first) plus summary counts.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireFollowUpUser(req);
    if (user instanceof NextResponse) return user;

    const sp = req.nextUrl.searchParams;
    const status = (sp.get("status") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is FollowUpStatus =>
        (FOLLOW_UP_STATUSES as readonly string[]).includes(s),
      );

    const [items, summary] = await Promise.all([
      listTrackedEmails(user.userId, {
        status,
        applicationId: sp.get("applicationId") ?? undefined,
        limit: Number(sp.get("limit")) || undefined,
        skip: Number(sp.get("skip")) || undefined,
      }),
      getFollowUpSummary(user.userId),
    ]);

    return NextResponse.json({ success: true, data: items, summary }, { headers: noStore });
  } catch (error) {
    return errorResponse("GET /api/follow-ups", error);
  }
}
