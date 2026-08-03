import ConnectDB from "@/lib/db";
import ProfileModel from "@/models/user";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { computeProfileCompletion } from "@/lib/profileCompletion";

const emptyDisplayValues = new Set(["", "Not specified"]);

function normalizeString(value: unknown) {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();

  return emptyDisplayValues.has(trimmed) ? undefined : trimmed;
}

function compactObject<T extends Record<string, unknown>>(object: T) {
  return Object.fromEntries(
    Object.entries(object)
      .map(([key, value]) => [key, normalizeString(value)])
      .filter(([, value]) => value !== undefined),
  );
}

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user;
}

function parseDate(date?: string) {
  if (!date) return undefined;

  const [day, month, year] = date.split("-");

  return new Date(`${year}-${month}-${day}`);
}

export async function GET() {
  try {
    await ConnectDB();

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    let profile = await ProfileModel.findOne({
      authUserId: user.id,
    });

    if (!profile) {
      profile = await ProfileModel.create({
        authUserId: user.id,
        fullName: user.name,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        ...profile.toObject(),
        email: user.email,
        image: user.image,
        name: user.name,
        // avatar is stored on the profile model, included via toObject()
      },
      profileCompletion: computeProfileCompletion(profile.toObject()),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ConnectDB();

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const body = await req.json();

    const updateData = compactObject({
      fullName: body.fullName,
      currentJobTitle: body.currentJobTitle,
      yearsOfExperience: body.yearsOfExperience,
      currentLocation: body.currentLocation,
      skills: Array.isArray(body.skills)
        ? body.skills.map(normalizeString).filter(Boolean)
        : body.skills,
      phone: body.phone,
      resume: body.resume,
      avatar: body.avatar,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth ? parseDate(body.dateOfBirth) : undefined,
      country: body.country,
      currentCompany: body.currentCompany,
      currentRole: body.currentRole,
      preferredJobType: body.preferredJobType,
      workMode: body.workMode,
      noticePeriod: body.noticePeriod,
      expectedSalary: body.expectedSalary,
      headline: body.headline,
    });

    const education = compactObject({
      "education.degree": body.education?.degree,
      "education.university": body.education?.university,
      "education.passingYear": body.education?.passingYear,
      "education.cgpa": body.education?.cgpa,
    });

    const socialLinks = compactObject({
      "socialLinks.portfolio": body.socialLinks?.portfolio,
      "socialLinks.github": body.socialLinks?.github,
      "socialLinks.linkedin": body.socialLinks?.linkedin,
    });

    const profile = await ProfileModel.findOneAndUpdate(
      {
        authUserId: user.id,
      },
      {
        $set: {
          ...updateData,
          ...education,
          ...socialLinks,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      },
    );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
