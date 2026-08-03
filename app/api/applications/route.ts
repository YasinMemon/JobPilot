import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import ApplicationModel from "@/models/applications";
import { serializeApplication } from "@/lib/serializers/application.serializer";
import { ApplicationStatus } from "@/types/applications/type";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

/**
 * GET /api/applications
 *
 * Returns a paginated, filtered, and sorted list of applications for the
 * authenticated user.
 *
 * Query params:
 *   page        - Page number (default: 1)
 *   limit       - Items per page (default: 12)
 *   search      - Text search across company, position, email
 *   status      - Filter by ApplicationStatus (or "All")
 *   platform    - Filter by platform string
 *   appliedVia  - Filter by appliedVia string
 *   labels      - Comma-separated label list
 *   startDate   - ISO date string (inclusive lower bound on receivedAt)
 *   endDate     - ISO date string (inclusive upper bound on receivedAt)
 *   sortBy      - "applicationDate" | "company" | "status" | "receivedAt" (default)
 *   sortOrder   - "asc" | "desc" (default: "desc")
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await ConnectDB();

    const { searchParams } = new URL(req.url);

    // ── Pagination ────────────────────────────────────────────────────────────
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "12", 10)),
    );
    const skip = (page - 1) * limit;

    // ── Filters ───────────────────────────────────────────────────────────────
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "All";
    const platform = searchParams.get("platform") || "";
    const appliedVia = searchParams.get("appliedVia") || "";
    const labelsParam = searchParams.get("labels") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    // ── Sorting ───────────────────────────────────────────────────────────────
    const sortBy = searchParams.get("sortBy") || "receivedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const validSortFields = ["applicationDate", "company", "status", "receivedAt"];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "receivedAt";

    // ── Build Query ───────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(session.user.id),
    };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Status filter
    if (status && status !== "All") {
      const validStatuses = Object.values(ApplicationStatus) as string[];
      if (validStatuses.includes(status)) {
        query.status = status;
      }
    }

    // Platform filter
    if (platform) {
      query.platform = { $regex: platform, $options: "i" };
    }

    // Applied via filter
    if (appliedVia) {
      query.appliedVia = { $regex: appliedVia, $options: "i" };
    }

    // Labels filter
    if (labelsParam) {
      const labels = labelsParam.split(",").map((l) => l.trim()).filter(Boolean);
      if (labels.length > 0) {
        query.labels = { $in: labels };
      }
    }

    // Date range filter
    if (startDate || endDate) {
      query.receivedAt = {};
      if (startDate) query.receivedAt.$gte = new Date(startDate);
      if (endDate) query.receivedAt.$lte = new Date(endDate);
    }

    // ── Execute ───────────────────────────────────────────────────────────────
    const sortQuery: Record<string, 1 | -1> = { [safeSortBy]: sortOrder };
    // When using text search, also sort by text score
    if (search) {
      sortQuery.score = { $meta: "textScore" } as unknown as 1 | -1;
    }

    const [applications, total] = await Promise.all([
      ApplicationModel.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      ApplicationModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: applications.map((app) =>
        serializeApplication(app as unknown as Parameters<typeof serializeApplication>[0]),
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("[GET /api/applications] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
