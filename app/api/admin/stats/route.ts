import ConnectDB from "@/lib/db";
import ApplicationModel from "@/models/applications";
import userModel from "@/models/user";

export async function GET() {
  try {
    await ConnectDB();

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [
      totalUsers,
      newSignupsThisWeek,
      totalApplications,
      applicationsByStatus,
    ] = await Promise.all([
      userModel.countDocuments({}),
      userModel.countDocuments({ createdAt: { $gte: startOfWeek } }),
      ApplicationModel.countDocuments({}),
      ApplicationModel.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusMap: Record<string, number> = {};
    for (const item of applicationsByStatus) {
      statusMap[item._id] = item.count;
    }

    return Response.json({
      totalUsers,
      newSignupsThisWeek,
      totalApplications,
      applicationsByStatus: statusMap,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
