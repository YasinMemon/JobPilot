import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireResumeUser, reserveAICredit } from "@/lib/resume/auth";
import { ResumeError, errorResponse } from "@/lib/resume/errors";
import { assertUsableJobDescription, parseJson } from "@/lib/resume/http";
import { extractJobDescriptionText } from "@/lib/resume/extractText";
import { loadResumeProfile } from "@/lib/resume/profile";
import { MAX_JD_CHARS } from "@/lib/resume/schemas";
import { analyzeJobDescription, withSkillGap } from "@/services/resume.service";

const jsonBody = z.object({
  jobDescription: z.string().max(MAX_JD_CHARS * 2).default(""),
  jobTitle: z.string().trim().max(160).optional(),
  company: z.string().trim().max(160).optional(),
  location: z.string().trim().max(160).optional(),
});

/**
 * POST /api/resume/analyze-jd
 * Accepts JSON ({ jobDescription, jobTitle?, company?, location? }) or
 * multipart/form-data with a `file` (.pdf/.docx/.txt) plus the same fields.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireResumeUser(req.headers);

    let jobDescription = "";
    let hints: { jobTitle?: string; company?: string; location?: string } = {};

    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (file instanceof File) {
        jobDescription = await extractJobDescriptionText(file);
      } else {
        jobDescription = String(form.get("jobDescription") ?? "");
      }
      const str = (k: string) => {
        const v = form.get(k);
        return typeof v === "string" && v.trim() ? v.trim().slice(0, 160) : undefined;
      };
      hints = { jobTitle: str("jobTitle"), company: str("company"), location: str("location") };
    } else {
      const body = await parseJson(req, jsonBody);
      jobDescription = body.jobDescription;
      hints = { jobTitle: body.jobTitle, company: body.company, location: body.location };
    }

    jobDescription = assertUsableJobDescription(jobDescription);
    if (jobDescription.length > MAX_JD_CHARS) {
      jobDescription = jobDescription.slice(0, MAX_JD_CHARS);
    }

    const recordUsage = await reserveAICredit(user.id);
    const { analysis, tokens } = await analyzeJobDescription(jobDescription, hints);

    if (
      analysis.requiredSkills.length === 0 &&
      analysis.preferredSkills.length === 0 &&
      analysis.keywords.length === 0
    ) {
      throw new ResumeError(
        "JD_TOO_SHORT",
        "We couldn't find any skills or requirements in that text. Make sure it's a job description.",
        422,
      );
    }

    const { profile } = await loadResumeProfile(user);
    await recordUsage(tokens);

    return NextResponse.json({
      success: true,
      data: { analysis: withSkillGap(analysis, profile), jobDescription },
    });
  } catch (error) {
    return errorResponse(error, "POST /api/resume/analyze-jd");
  }
}
