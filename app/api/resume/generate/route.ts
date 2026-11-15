import { NextRequest, NextResponse } from "next/server";
import { requireResumeUser, reserveAICredit } from "@/lib/resume/auth";
import { ResumeError, errorResponse } from "@/lib/resume/errors";
import { assertUsableJobDescription, parseJson } from "@/lib/resume/http";
import { computeMatch } from "@/lib/resume/match";
import { isProfileSufficient, loadResumeProfile, profileGaps } from "@/lib/resume/profile";
import { generateBodySchema } from "@/lib/resume/schemas";
import {
  analyzeJobDescription,
  generateTailoredResume,
  withSkillGap,
} from "@/services/resume.service";
import type { JDAnalysis } from "@/types/resume";

/** POST /api/resume/generate — build a tailored resume from profile + JD. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireResumeUser(req.headers);
    const body = await parseJson(req, generateBodySchema);
    const jobDescription = assertUsableJobDescription(body.jobDescription);

    const { profile } = await loadResumeProfile(user);
    if (!isProfileSufficient(profile)) {
      throw new ResumeError(
        "PROFILE_INSUFFICIENT",
        "Your profile needs more information before we can generate a resume.",
        422,
        { gaps: profileGaps(profile) },
      );
    }

    const recordUsage = await reserveAICredit(user.id);
    let tokens = 0;

    let base = body.analysis;
    if (!base) {
      const analyzed = await analyzeJobDescription(jobDescription);
      base = analyzed.analysis as JDAnalysis;
      tokens += analyzed.tokens;
    }
    // Always recompute the skill gap server-side from the real profile
    const analysis = withSkillGap(base as JDAnalysis, profile);

    const generated = await generateTailoredResume(profile, analysis);
    tokens += generated.tokens;
    const matchBreakdown = computeMatch(generated.content, analysis);
    await recordUsage(tokens);

    return NextResponse.json({
      success: true,
      data: {
        content: generated.content,
        analysis,
        matchBreakdown,
        matchScore: matchBreakdown.overall,
        missingSkills: analysis.missingSkills,
      },
    });
  } catch (error) {
    return errorResponse(error, "POST /api/resume/generate");
  }
}
