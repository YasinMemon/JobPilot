import ConnectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import ProfileModel from "@/models/user";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await ConnectDB();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const existingProfile = await ProfileModel.findOne({
      authUserId: session.user.id,
    });

    if (existingProfile) {
      return NextResponse.json(
        {
          success: true,
          message: "Profile already exists",
          data: existingProfile,
        },
        { status: 200 },
      );
    }

    const formData = await req.formData();

    const fullName = formData.get("fullName")?.toString() || session.user.name;
    const phone = formData.get("phone")?.toString() || "";
    const currentJobTitle = formData.get("currentJobTitle")?.toString() || "";
    const yearsOfExperience =
      formData.get("yearsOfExperience")?.toString() || "";
    const currentLocation = formData.get("currentLocation")?.toString() || "";

    const skills = formData.getAll("skills").map(String);

    // TODO: Upload resume to Cloudinary here
    const resume = "";

    const profile = await ProfileModel.create({
      authUserId: session.user.id,

      fullName,

      phone,

      currentJobTitle,

      yearsOfExperience,

      currentLocation,

      skills,

      resume,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profile created successfully",
        data: profile,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
