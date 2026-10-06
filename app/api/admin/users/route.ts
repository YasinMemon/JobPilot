import ConnectDB from "@/lib/db";
import userModel from "@/models/user";

export async function GET() {
  try {
    await ConnectDB();

    // better-auth stores users with _id (ObjectId) as the primary key.
    // authUserId is stored as a string, so we convert it before joining.
    const users = await userModel.aggregate([
      {
        $addFields: {
          authUserObjId: { $toObjectId: "$authUserId" },
        },
      },
      {
        $lookup: {
          from: "user", // better-auth default collection name
          localField: "authUserObjId",
          foreignField: "_id",
          as: "authUser",
        },
      },
      {
        $addFields: {
          email: { $arrayElemAt: ["$authUser.email", 0] },
        },
      },
      {
        $project: {
          authUser: 0,
          authUserObjId: 0,
        },
      },
    ]);

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(JSON.stringify({ message: "Error fetching users" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

