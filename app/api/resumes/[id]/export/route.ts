import { NextRequest, NextResponse } from "next/server";
import ResumeModel from "@/models/Resume";
import { requireResumeUser } from "@/lib/resume/auth";
import { ResumeError, errorResponse } from "@/lib/resume/errors";
import { isValidObjectId, parseJson } from "@/lib/resume/http";
import { safeFileName } from "@/lib/resume/layout";
import { exportBodySchema, resumeContentSchema, templateSchema } from "@/lib/resume/schemas";
import { UnsupportedPdfTextError, renderResumeDocx, renderResumePdf } from "@/services/resumeExport.service";

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/resumes/:id/export — body { format: "pdf" | "docx" }. */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireResumeUser(req.headers);
    const { id } = await context.params;
    if (!isValidObjectId(id)) throw new ResumeError("NOT_FOUND", "Resume not found.", 404);

    const { format } = await parseJson(req, exportBodySchema);
    const doc = await ResumeModel.findOne({ _id: id, userId: user.id }).lean<{
      name: string;
      content: unknown;
      template: unknown;
    }>();
    if (!doc) throw new ResumeError("NOT_FOUND", "Resume not found.", 404);

    const content = resumeContentSchema.parse(doc.content);
    const template = templateSchema.catch("ats-classic").parse(doc.template);

    let bytes: Uint8Array;
    let mime: string;
    try {
      if (format === "pdf") {
        bytes = await renderResumePdf(content, template);
        mime = "application/pdf";
      } else {
        bytes = new Uint8Array(await renderResumeDocx(content, template));
        mime =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
    } catch (err) {
      if (err instanceof UnsupportedPdfTextError) {
        throw new ResumeError(
          "PDF_UNSUPPORTED_TEXT",
          "This resume contains characters the PDF export can't render yet. Please download the DOCX instead.",
          422,
        );
      }
      console.error("[export] render failed:", err instanceof Error ? err.message : err);
      throw new ResumeError(
        "EXPORT_FAILED",
        `We couldn't generate the ${format.toUpperCase()} file. Please try again.`,
        500,
      );
    }

    const filename = `${safeFileName(doc.name)}.${format}`;
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return errorResponse(error, "POST /api/resumes/:id/export");
  }
}
