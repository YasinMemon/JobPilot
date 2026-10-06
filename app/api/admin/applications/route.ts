import ConnectDB from "@/lib/db";
import ApplicationModel from "@/models/applications";
import userModel from "@/models/user";

export async function GET(req: Request) {
  try {
    await ConnectDB();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = parseInt(url.searchParams.get("limit") ?? "20");
    const search = url.searchParams.get("search") ?? "";
    const skip = (page - 1) * limit;

    const matchStage = search
      ? {
          $or: [
            { company: { $regex: search, $options: "i" } },
            { position: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [applications, total] = await Promise.all([
      ApplicationModel.aggregate([
        { $match: matchStage },
        { $sort: { receivedAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDoc",
          },
        },
        {
          $addFields: {
            userName: { $arrayElemAt: ["$userDoc.fullName", 0] },
            userAvatar: { $arrayElemAt: ["$userDoc.avatar", 0] },
          },
        },
        {
          $project: {
            userDoc: 0,
          },
        },
      ]),
      ApplicationModel.countDocuments(matchStage),
    ]);

    return Response.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin applications:", error);
    return Response.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}