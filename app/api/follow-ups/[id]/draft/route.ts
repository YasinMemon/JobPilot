import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  errorResponse,
  readJson,
  requireFollowUpUser,
  resolveId,
  type IdContext,
} from "@/lib/followups/route";
import { generateDraft, saveDraft } from "@/services/followup.service";

/**
 * POST /api/follow-ups/:id/draft — generate (or regenerate) an AI draft.
 * This ONLY stores a draft. It never sends an email.
 */
export async function POST(req: NextRequest, context: IdContext) {
  try {
    const user = await requireFollowUpUser(req);
    if (user instanceof NextResponse) return user;
    const id = await resolveId(context);
    if (id instanceof NextResponse) return id;

    const email = await generateDraft(user.userId, id, user.userName);
    return NextResponse.json({ success: true, data: email });
  } catch (error) {
    return errorResponse("POST /api/follow-ups/:id/draft", error);
  }
}

const draftBodySchema = z.object({
  to: z.string().trim().min(1, "Recipient is required").max(1000),
  subject: z.string().trim().min(1, "Subject is required").max(500),
  body: z.string().min(1, "Email body is required").max(100_000),
});

/** PUT /api/follow-ups/:id/draft — save the user's edits without sending. */
export async function PUT(req: NextRequest, context: IdContext) {
  try {
    const user = await requireFollowUpUser(req);
    if (user instanceof NextResponse) return user;
    const id = await resolveId(context);
    if (id instanceof NextResponse) return id;
    const body = await readJson(req, draftBodySchema);
    if (body instanceof NextResponse) return body;

    const email = await saveDraft(user.userId, id, body);
    return NextResponse.json({ success: true, data: email });
  } catch (error) {
    return errorResponse("PUT /api/follow-ups/:id/draft", error);
  }
}
