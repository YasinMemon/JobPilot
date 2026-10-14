import { NextRequest, NextResponse } from "next/server";
import { requireResumeUser, reserveAICredit } from "@/lib/resume/auth";
import { errorResponse } from "@/lib/resume/errors";
import { parseJson } from "@/lib/resume/http";
import { computeSkillGap, profileFullText } from "@/lib/resume/match";
import { loadResumeProfile } from "@/lib/resume/profile";
import { improveBodySchema } from "@/lib/resume/schemas";
import { improveText } from "@/services/resume.service";
import type { JDAnalysis } from "@/types/resume";

/**
 * POST /api/resume/improve-section — rewrite one bullet or the summary.
 * The rewrite is grounded against the user's own profile data and rejected
 * if it adds unsupported numbers or skills.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireResumeUser(req.headers);
    const body = await parseJson(req, improveBodySchema);
    const { profile } = await loadResumeProfile(user);

    let source = profileFullText(profile);
    const { section, itemId } = body.target;
    if (section === "experience" && itemId) {
      const e = profile.experience.find((x) => x.id === itemId);
      if (e) {
        source = [e.title, e.company, e.description, ...e.achievements, ...e.technologies].join("\n");
      }
    } else if (section === "projects" && itemId) {
      const p = profile.projects.find((x) => x.id === itemId);
      if (p) {
        source = [p.name, p.description, ...p.responsibilities, ...p.achievements, ...p.technologies].join("\n");
      }
    }

    const analysis = body.analysis as JDAnalysis | undefined;
    const unsupportedSkills = analysis
      ? computeSkillGap(analysis, profile).missingSkills
      : [];

    const recordUsage = await reserveAICredit(user.id);
    const { text, tokens } = await improveText({
      action: body.action,
      text: body.text,
      source,
      analysis,
      unsupportedSkills,
    });
    await recordUsage(tokens);

    return NextResponse.json({ success: true, data: { text } });
  } catch (error) {
    return errorResponse(error, "POST /api/resume/improve-section");
  }
}
