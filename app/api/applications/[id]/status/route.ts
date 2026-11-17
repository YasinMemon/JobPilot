import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import ApplicationModel from "@/models/applications";
import { serializeApplication } from "@/lib/serializers/application.serializer";
import { ApplicationStatus } from "@/types/applications/type";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { notifyApplicationStatusChanged } from "@/lib/notifications/triggers";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/applications/:id/status
 *
 * Updates only the status field of an application.
 * Body: { status: ApplicationStatus }
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
    const { status } = body;

    // Validate status
    const validStatuses = Object.values(ApplicationStatus) as string[];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    await ConnectDB();

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    // Atomically read the previous status while applying the new one, so a
    // notification is only emitted for a real transition (no-op updates and
    // concurrent duplicate requests produce none).
    const previous = await ApplicationModel.findOneAndUpdate(
      { _id: id, userId: userObjectId },
      { $set: { status } },
      { new: false, projection: { status: 1, company: 1, position: 1 } },
    ).lean();

    if (!previous) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 },
      );
    }

    if (previous.status !== status) {
      await notifyApplicationStatusChanged(
        userObjectId,
        { id, company: previous.company, position: previous.position },
        previous.status,
        status,
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
    console.error("[PATCH /api/applications/:id/status] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
