import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  requireFollowUpUser,
  resolveId,
  type IdContext,
} from "@/lib/followups/route";
import { checkReplyStatus } from "@/services/followup.service";

/** POST /api/follow-ups/:id/check-reply — live Gmail reply check. */
export async function POST(req: NextRequest, context: IdContext) {
  try {
    const user = await requireFollowUpUser(req);
    if (user instanceof NextResponse) return user;
    const id = await resolveId(context);
    if (id instanceof NextResponse) return id;

    const { replied, email } = await checkReplyStatus(user.userId, id);
    return NextResponse.json({ success: true, replied, data: email });
  } catch (error) {
    return errorResponse("POST /api/follow-ups/:id/check-reply", error);
  }
}
