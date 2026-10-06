import ConnectDB from "@/lib/db";
import clientPromise from "@/lib/mongodb";
import userModel from "@/models/user";
import { ObjectId } from "mongodb";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DELETE a user by their custom User _id
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await ConnectDB();

    const user = await userModel.findById(id);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const authUserId = user.authUserId;

    // Remove from custom User collection
    await userModel.findByIdAndDelete(id);

    // Remove from better-auth user collection
    const client = await clientPromise;
    const db = client.db();
    await db
      .collection("user")
      .deleteOne({ _id: new ObjectId(authUserId) });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return Response.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

// PATCH — update role
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { role } = body as { role: "user" | "admin" };

    if (!["user", "admin"].includes(role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    await ConnectDB();

    const user = await userModel.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ success: true, role: user.role });
  } catch (error) {
    console.error("Error updating user role:", error);
    return Response.json({ error: "Failed to update role" }, { status: 500 });
  }
}