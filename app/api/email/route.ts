import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import userModel from "@/models/user";
import { askAi } from "@/services/ai.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await ConnectDB();

  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const user = await userModel.findOne({ authUserId: session.user.id });

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Profile not found" },
      { status: 404 },
    );
  }

  const { fullName, skills, experience, education, projects } = user;

  const body = await req.json();
  const {
    jd,
    hasResume = false,
    hasPortfolio = false,
  } = body as {
    jd: string;
    hasResume?: boolean;
    hasPortfolio?: boolean;
  };

  const result = await askAi(jd, {
    fullName,
    skills,
    experience,
    education,
    projects,
    hasResume,
    hasPortfolio,
  });

  return NextResponse.json(
    {
      success: true,
      message: "Email generated successfully",
      subject: result.subject,
      html: result.html,
    },
    { status: 200 },
  );
}
