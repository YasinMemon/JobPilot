import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import ResumeModel from "@/models/Resume";
import { requireResumeUser } from "@/lib/resume/auth";
import { ResumeError, errorResponse } from "@/lib/resume/errors";
import { isValidObjectId, parseJson } from "@/lib/resume/http";
import { saveResumeSchema } from "@/lib/resume/schemas";
import { serializeResume, serializeResumeSummary } from "@/lib/resume/serialize";

const MAX_RESUMES_PER_USER = 100;

const createBody = z.union([
  saveResumeSchema,
  z.object({
    duplicateFromId: z.string(),
    name: z.string().trim().min(1).max(140).optional(),
  }),
]);

/** GET /api/resumes — the signed-in user's saved resumes (newest first). */
export async function GET(req: NextRequest) {
  try {
    const user = await requireResumeUser(req.headers);
    const docs = await ResumeModel.find({ userId: user.id })
      .select("name targetJobTitle targetCompany template matchScore createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(MAX_RESUMES_PER_USER)
      .lean();
    return NextResponse.json({ success: true, data: docs.map(serializeResumeSummary) });
  } catch (error) {
    return errorResponse(error, "GET /api/resumes");
  }
}

/** POST /api/resumes — save a new resume, or duplicate an owned one. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireResumeUser(req.headers);
    const body = await parseJson(req, createBody);

    if ((await ResumeModel.countDocuments({ userId: user.id })) >= MAX_RESUMES_PER_USER) {
      throw new ResumeError(
        "VALIDATION",
        "You've reached the limit of 100 saved resumes. Delete some to save more.",
      );
    }

    let payload: Record<string, unknown>;
    if ("duplicateFromId" in body) {
      if (!isValidObjectId(body.duplicateFromId)) {
        throw new ResumeError("NOT_FOUND", "Resume not found.", 404);
      }
      // Ownership enforced in the query itself
      const source = await ResumeModel.findOne({
        _id: body.duplicateFromId,
        userId: user.id,
      }).lean<Record<string, unknown> & { name: string }>();
      if (!source) throw new ResumeError("NOT_FOUND", "Resume not found.", 404);

      const { _id, createdAt, updatedAt, __v, ...rest } = source as Record<string, unknown>;
      void _id; void createdAt; void updatedAt; void __v;
      payload = { ...rest, name: body.name ?? `${source.name} (Copy)` };
    } else {
      payload = body;
    }

    const created = await ResumeModel.create({ ...payload, userId: user.id });
    return NextResponse.json(
      { success: true, data: serializeResume(created.toObject()) },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, "POST /api/resumes");
  }
}
