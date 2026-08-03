/**
 * POST /api/upload
 *
 * Generic file upload endpoint for AI attachments (resume, JD, other).
 * Uploads to Cloudinary and returns the URL.
 *
 * Form data:
 *   file            — The file to upload
 *   attachmentType  — "resume" | "jd" | "other"
 */

import { auth } from "@/lib/auth";
import { uploadToCloudinaryUnsigned } from "@/lib/cloudinaryUpload";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const attachmentType = (formData.get("attachmentType") as string) || "other";

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only PDF, DOCX, and TXT files are supported" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "File must be under 10 MB" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeUserId = session.user.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    const folder = `jobpilot/ai-attachments/${attachmentType}`;
    const public_id = `${attachmentType}_${safeUserId}_${Date.now()}`;

    const { secure_url } = await uploadToCloudinaryUnsigned(buffer, file.type, {
      folder,
      resource_type: "raw",
      public_id,
    });

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        fileId: public_id,
        url: secure_url,
        secure_url,
        public_id,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        attachmentType,
      },
    });
  } catch (error) {
    console.error("[POST /api/upload] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}
