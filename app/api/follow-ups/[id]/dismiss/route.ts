import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  requireFollowUpUser,
  resolveId,
  type IdContext,
} from "@/lib/followups/route";
import { dismissFollowUp } from "@/services/followup.service";

/** POST /api/follow-ups/:id/dismiss — stop reminders for this email. */
export async function POST(req: NextRequest, context: IdContext) {
  try {
    const user = await requireFollowUpUser(req);
    if (user instanceof NextResponse) return user;
    const id = await resolveId(context);
    if (id instanceof NextResponse) return id;

    const email = await dismissFollowUp(user.userId, id);
    return NextResponse.json({ success: true, data: email });
  } catch (error) {
    return errorResponse("POST /api/follow-ups/:id/dismiss", error);
  }
}
