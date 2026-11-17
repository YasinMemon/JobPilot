import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  errorResponse,
  readJson,
  requireFollowUpUser,
  resolveId,
  type IdContext,
} from "@/lib/followups/route";
import { snoozeFollowUp } from "@/services/followup.service";

const snoozeSchema = z
  .object({
    days: z.number().int().min(1).max(90).optional(),
    until: z.iso.datetime({ offset: true }).optional(),
  })
  .refine((v) => v.days !== undefined || v.until !== undefined, {
    message: "Provide days or until",
  });

/** POST /api/follow-ups/:id/snooze — "Remind me later" (days or a date). */
export async function POST(req: NextRequest, context: IdContext) {
  try {
    const user = await requireFollowUpUser(req);
    if (user instanceof NextResponse) return user;
    const id = await resolveId(context);
    if (id instanceof NextResponse) return id;
    const body = await readJson(req, snoozeSchema);
    if (body instanceof NextResponse) return body;

    const email = await snoozeFollowUp(user.userId, id, {
      days: body.days,
      until: body.until ? new Date(body.until) : undefined,
    });
    return NextResponse.json({ success: true, data: email });
  } catch (error) {
    return errorResponse("POST /api/follow-ups/:id/snooze", error);
  }
}
