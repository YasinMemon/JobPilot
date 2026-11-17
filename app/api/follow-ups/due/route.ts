import { NextRequest, NextResponse } from "next/server";
import { errorResponse, noStore, requireFollowUpUser } from "@/lib/followups/route";
import { listTrackedEmails } from "@/services/followup.service";

/** GET /api/follow-ups/due — reminders waiting for the user's action. */
export async function GET(req: NextRequest) {
  try {
    const user = await requireFollowUpUser(req);
    if (user instanceof NextResponse) return user;

    const items = await listTrackedEmails(user.userId, {
      status: ["reminder_due", "drafting", "draft_ready"],
      limit: 100,
    });
    return NextResponse.json({ success: true, data: items }, { headers: noStore });
  } catch (error) {
    return errorResponse("GET /api/follow-ups/due", error);
  }
}
