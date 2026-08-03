/**
 * GET /api/ai/prompts
 *
 * Returns categorized suggested prompts for the AI assistant.
 * Authenticated — returns prompts relevant to the user's profile.
 */

import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { SUGGESTED_PROMPTS_DB } from "@/services/prompt.service";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: SUGGESTED_PROMPTS_DB,
    });
  } catch (error) {
    console.error("[GET /api/ai/prompts] Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
