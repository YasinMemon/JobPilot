import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/account/google-status
 *
 * Checks whether the authenticated user has a Google provider linked.
 * Session is read server-side — no userId is accepted from the client.
 *
 * Response (connected):
 *   { connected: true, provider: "google", email: "user@gmail.com" }
 *
 * Response (not connected):
 *   { connected: false }
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Get session from cookie — never trust frontend input
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. List all accounts linked to this user via Better Auth's internal adapter
    const accounts = await auth.api.listUserAccounts({
      headers: req.headers,
    });

    // 3. Find the Google provider
    const googleAccount = accounts.find(
      (acc: { providerId: string }) => acc.providerId === "google",
    );

    if (!googleAccount) {
      return NextResponse.json({ connected: false });
    }

    // 4. The email for the linked Google account is the session user's email
    //    (Better Auth updates the user email on link if allowDifferentEmails is true,
    //    or keeps it as-is. The user's primary email is always in the session.)
    return NextResponse.json({
      connected: true,
      provider: "google",
      email: session.user.email,
    });
  } catch (error) {
    console.error("[google-status] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
