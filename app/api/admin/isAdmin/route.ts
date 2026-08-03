import { getCurrentAuthUser } from "@/middleware/middleware";
import userModel from "@/models/user";

export async function GET(request: Request) {
  try {
    const authUser = await getCurrentAuthUser(request);
    const user = await userModel.findOne({ authUserId: authUser?.id });

    if (!user) {
      return new Response(JSON.stringify({ isAdmin: false }), { status: 200 });
    }

    if (user.role !== "admin") {
      return new Response(JSON.stringify({ isAdmin: false }), { status: 200 });
    }

    return new Response(JSON.stringify({ isAdmin: true }), { status: 200 });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return new Response(
      JSON.stringify({ isAdmin: false, error: "Internal Server Error" }),
      { status: 500 },
    );
  }
}
