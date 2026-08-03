import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import ApplicationModel from "@/models/applications";
import { ApplicationStatus } from "@/types/applications/type";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

/**
 * GET /api/applications/stats
 *
 * Returns aggregate statistics for the authenticated user's applications.
 *
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       total: number,
 *       applied: number,
 *       interview: number,
 *       offer: number,
 *       rejected: number,
 *       hired: number,
 *       successRate: number  // (offer + hired) / total * 100
 *     }
 *   }
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await ConnectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Single aggregation pipeline for efficiency
    const aggregation = await ApplicationModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Map aggregation results to a status→count object
    const countByStatus: Record<string, number> = {};
    let total = 0;

    for (const item of aggregation) {
      countByStatus[item._id] = item.count;
      total += item.count;
    }

    const get = (status: ApplicationStatus) => countByStatus[status] ?? 0;

    const offer = get(ApplicationStatus.OFFER);
    const hired = get(ApplicationStatus.HIRED);
    const successRate =
      total > 0 ? Math.round(((offer + hired) / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        total,
        applied: get(ApplicationStatus.APPLIED),
        interview: get(ApplicationStatus.INTERVIEW),
        offer,
        rejected: get(ApplicationStatus.REJECTED),
        hired,
        successRate,
      },
    });
  } catch (error) {
    console.error("[GET /api/applications/stats] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
