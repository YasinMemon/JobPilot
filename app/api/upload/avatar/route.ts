import { auth } from "@/lib/auth";
import { uploadToCloudinaryUnsigned } from "@/lib/cloudinaryUpload";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 },
      );
    }

    // Validate image type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPEG, PNG, WebP, or GIF images are allowed",
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "Image size must be under 5 MB" },
        { status: 400 },
      );
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize user ID for public_id (remove special chars)
    const safeUserId = session.user.id.replace(/[^a-zA-Z0-9_-]/g, "_");

    // Upload via unsigned preset (bypasses API key upload permission restriction)
    const { secure_url, public_id } = await uploadToCloudinaryUnsigned(
      buffer,
      file.type,
      {
        folder: "jobpilot/avatars",
        resource_type: "image",
        public_id: `avatar_${safeUserId}`,
      },
    );

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: { url: secure_url, public_id },
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to upload avatar",
      },
      { status: 500 },
    );
  }
}
