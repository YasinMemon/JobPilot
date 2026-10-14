import { NextRequest, NextResponse } from "next/server";
import ResumeModel from "@/models/Resume";
import { requireResumeUser } from "@/lib/resume/auth";
import { ResumeError, errorResponse } from "@/lib/resume/errors";
import { isValidObjectId, parseJson } from "@/lib/resume/http";
import { updateResumeSchema } from "@/lib/resume/schemas";
import { serializeResume } from "@/lib/resume/serialize";

type RouteContext = { params: Promise<{ id: string }> };

async function resolveId(context: RouteContext) {
  const { id } = await context.params;
  if (!isValidObjectId(id)) throw new ResumeError("NOT_FOUND", "Resume not found.", 404);
  return id;
}

/** GET /api/resumes/:id */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireResumeUser(req.headers);
    const id = await resolveId(context);
    // Ownership is part of the query: another user's id is simply "not found"
    const doc = await ResumeModel.findOne({ _id: id, userId: user.id }).lean();
    if (!doc) throw new ResumeError("NOT_FOUND", "Resume not found.", 404);
    return NextResponse.json({ success: true, data: serializeResume(doc) });
  } catch (error) {
    return errorResponse(error, "GET /api/resumes/:id");
  }
}

/** PUT /api/resumes/:id — update (partial) fields of an owned resume. */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireResumeUser(req.headers);
    const id = await resolveId(context);
    const body = await parseJson(req, updateResumeSchema);

    if (Object.keys(body).length === 0) {
      throw new ResumeError("VALIDATION", "Nothing to update.");
    }

    const doc = await ResumeModel.findOneAndUpdate(
      { _id: id, userId: user.id },
      { $set: body },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!doc) throw new ResumeError("NOT_FOUND", "Resume not found.", 404);
    return NextResponse.json({ success: true, data: serializeResume(doc) });
  } catch (error) {
    return errorResponse(error, "PUT /api/resumes/:id");
  }
}

/** DELETE /api/resumes/:id */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireResumeUser(req.headers);
    const id = await resolveId(context);
    const deleted = await ResumeModel.findOneAndDelete({ _id: id, userId: user.id });
    if (!deleted) throw new ResumeError("NOT_FOUND", "Resume not found.", 404);
    return NextResponse.json({ success: true, message: "Resume deleted." });
  } catch (error) {
    return errorResponse(error, "DELETE /api/resumes/:id");
  }
}
