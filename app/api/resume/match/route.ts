import { NextRequest, NextResponse } from "next/server";
import { requireResumeUser } from "@/lib/resume/auth";
import { errorResponse } from "@/lib/resume/errors";
import { parseJson } from "@/lib/resume/http";
import { computeMatch } from "@/lib/resume/match";
import { loadResumeProfile } from "@/lib/resume/profile";
import { matchBodySchema } from "@/lib/resume/schemas";
import { withSkillGap } from "@/services/resume.service";
import type { JDAnalysis, ResumeContent } from "@/types/resume";

/**
 * POST /api/resume/match — recompute the Resume-JD match for (edited) content.
 * Pure computation, no AI call, so it is cheap to run after every edit.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireResumeUser(req.headers);
    const body = await parseJson(req, matchBodySchema);
    const { profile } = await loadResumeProfile(user);

    const analysis = withSkillGap(body.analysis as JDAnalysis, profile);
    const matchBreakdown = computeMatch(body.content as ResumeContent, analysis);

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        matchBreakdown,
        matchScore: matchBreakdown.overall,
        missingSkills: analysis.missingSkills,
      },
    });
  } catch (error) {
    return errorResponse(error, "POST /api/resume/match");
  }
}
