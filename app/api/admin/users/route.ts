import ConnectDB from "@/lib/db";
import userModel from "@/models/user";

export async function GET() {
  try {
    await ConnectDB();
    const users = await userModel.find({});

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
