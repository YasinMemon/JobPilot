import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import ApplicationModel from "@/models/applications";
import { serializeApplication } from "@/lib/serializers/application.serializer";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { notifyInterviewScheduled } from "@/lib/notifications/triggers";

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/applications/:id ────────────────────────────────────────────────

/**
 * GET /api/applications/:id
 * Returns a single application by ID, verifying ownership.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid application ID" },
        { status: 400 },
      );
    }

    await ConnectDB();

    const application = await ApplicationModel.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(session.user.id),
    }).lean();

    if (!application) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeApplication(
        application as unknown as Parameters<typeof serializeApplication>[0],
      ),
    });
  } catch (error) {
    console.error("[GET /api/applications/:id] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/applications/:id ──────────────────────────────────────────────

/**
 * PATCH /api/applications/:id
 * Updates editable fields: notes, labels, appliedVia, platform, companyLogo
 * and interviewAt (ISO date string, or null to clear).
 * Does NOT update status (use the /status sub-route).
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid application ID" },
        { status: 400 },
      );
    }

    const body = await req.json();

    // Whitelist of updatable fields (never allow status, userId, gmailMessageId, etc.)
    const allowedUpdates: Record<string, unknown> = {};
    const ALLOWED_FIELDS = ["notes", "labels", "appliedVia", "platform", "companyLogo"];

    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        allowedUpdates[field] = body[field];
      }
    }

    // Interview time: validated separately (Date | null).
    let newInterviewAt: Date | null | undefined;
    if ("interviewAt" in body) {
      if (body.interviewAt === null || body.interviewAt === "") {
        newInterviewAt = null;
      } else {
        const parsed = new Date(body.interviewAt);
        if (
          typeof body.interviewAt !== "string" ||
          Number.isNaN(parsed.getTime())
        ) {
          return NextResponse.json(
            { success: false, message: "Invalid interviewAt date" },
            { status: 400 },
          );
        }
        newInterviewAt = parsed;
      }
      allowedUpdates.interviewAt = newInterviewAt;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update" },
        { status: 400 },
      );
    }

    await ConnectDB();

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    const previous = await ApplicationModel.findOneAndUpdate(
      { _id: id, userId: userObjectId },
      { $set: allowedUpdates },
      {
        new: false,
        projection: { interviewAt: 1, company: 1, position: 1 },
      },
    ).lean();

    if (!previous) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 },
      );
    }

    // Notify only when an upcoming interview time was actually set or changed.
    if (
      newInterviewAt &&
      newInterviewAt.getTime() > Date.now() &&
      previous.interviewAt?.getTime() !== newInterviewAt.getTime()
    ) {
      await notifyInterviewScheduled(
        userObjectId,
        { id, company: previous.company, position: previous.position },
        newInterviewAt,
        Boolean(previous.interviewAt),
      );
    }

    const updated = await ApplicationModel.findOne({
      _id: id,
      userId: userObjectId,
    }).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeApplication(
        updated as unknown as Parameters<typeof serializeApplication>[0],
      ),
    });
  } catch (error) {
    console.error("[PATCH /api/applications/:id] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/applications/:id ─────────────────────────────────────────────

/**
 * DELETE /api/applications/:id
 * Permanently deletes an application (ownership verified).
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid application ID" },
        { status: 400 },
      );
    }

    await ConnectDB();

    const deleted = await ApplicationModel.findOneAndDelete({
      _id: id,
      userId: new mongoose.Types.ObjectId(session.user.id),
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE /api/applications/:id] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
