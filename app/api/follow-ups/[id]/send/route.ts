import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  errorResponse,
  readJson,
  requireFollowUpUser,
  resolveId,
  type IdContext,
} from "@/lib/followups/route";
import { sendApprovedFollowUp } from "@/services/followup.service";

// Gmail send + a reply check can take a few seconds.
export const maxDuration = 30;

const sendSchema = z.object({
  to: z.string().trim().min(1, "Recipient is required").max(1000),
  subject: z.string().trim().min(1, "Subject is required").max(500),
  body: z.string().min(1, "Email body is required").max(100_000),
  /** Explicit approval: the composer sends `true` only from the Send Email button. */
  confirm: z.literal(true, { error: "Sending requires explicit confirmation" }),
});

/** POST /api/follow-ups/:id/send — send the user-approved follow-up via Gmail. */
export async function POST(req: NextRequest, context: IdContext) {
  try {
    const user = await requireFollowUpUser(req);
    if (user instanceof NextResponse) return user;
    const id = await resolveId(context);
    if (id instanceof NextResponse) return id;
    const body = await readJson(req, sendSchema);
    if (body instanceof NextResponse) return body;

    const email = await sendApprovedFollowUp(user.userId, id, body);
    return NextResponse.json({ success: true, message: "Follow-up sent", data: email });
  } catch (error) {
    return errorResponse("POST /api/follow-ups/:id/send", error);
  }
}
