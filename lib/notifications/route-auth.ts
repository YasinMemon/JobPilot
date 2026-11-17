import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Resolve the authenticated user id from the Better Auth session cookie.
 * The user id is NEVER taken from the request body, query or path, which is
 * what guarantees users can only reach their own notifications.
 */
export async function requireUserId(
  req: NextRequest,
): Promise<string | NextResponse> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  return session.user.id;
}
