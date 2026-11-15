import { NextRequest, NextResponse } from "next/server";
import ResumeProfileModel from "@/models/ResumeProfile";
import { requireResumeUser } from "@/lib/resume/auth";
import { errorResponse } from "@/lib/resume/errors";
import { parseJson } from "@/lib/resume/http";
import { loadResumeProfile, profileGaps } from "@/lib/resume/profile";
import { resumeProfileSchema } from "@/lib/resume/schemas";

/** GET /api/resume/profile — the signed-in user's resume profile. */
export async function GET(req: NextRequest) {
  try {
    const user = await requireResumeUser(req.headers);
    const { profile, seeded } = await loadResumeProfile(user);
    return NextResponse.json({
      success: true,
      data: profile,
      seeded,
      gaps: profileGaps(profile),
    });
  } catch (error) {
    return errorResponse(error, "GET /api/resume/profile");
  }
}

/** PUT /api/resume/profile — replace the signed-in user's resume profile. */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireResumeUser(req.headers);
    const data = await parseJson(req, resumeProfileSchema);

    await ResumeProfileModel.findOneAndUpdate(
      { userId: user.id },
      { $set: { data } },
      { upsert: true, returnDocument: "after" },
    );

    return NextResponse.json({
      success: true,
      data,
      seeded: false,
      gaps: profileGaps(data),
    });
  } catch (error) {
    return errorResponse(error, "PUT /api/resume/profile");
  }
}
