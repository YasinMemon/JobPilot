import ConnectDB from "@/lib/db";
import ProfileModel from "@/models/user";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { computeProfileCompletion } from "@/lib/profileCompletion";

export async function GET() {
  try {
    await ConnectDB();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const profile = await ProfileModel.findOne({ authUserId: user.id });

    if (!profile) {
      // No profile yet — all fields are missing
      return NextResponse.json({
        success: true,
        profileCompleted: false,
        completionPercentage: 0,
        missingFields: [
          "Full Name",
          "Phone Number",
          "Location",
          "Resume",
          "Skills",
          "Experience",
          "Education",
          "Preferred Job Role",
        ],
      });
    }

    const result = computeProfileCompletion(profile.toObject());

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[profile/completion]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
