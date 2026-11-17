import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  noStore,
  requireFollowUpUser,
  resolveId,
  type IdContext,
} from "@/lib/followups/route";
import { getTrackedEmail } from "@/services/followup.service";

/** GET /api/follow-ups/:id — details + history of one tracked email. */
export async function GET(req: NextRequest, context: IdContext) {
  try {
    const user = await requireFollowUpUser(req);
    if (user instanceof NextResponse) return user;
    const id = await resolveId(context);
    if (id instanceof NextResponse) return id;

    // Another user's record is indistinguishable from a missing one.
    const email = await getTrackedEmail(user.userId, id);
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Tracked email not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: email }, { headers: noStore });
  } catch (error) {
    return errorResponse("GET /api/follow-ups/:id", error);
  }
}
