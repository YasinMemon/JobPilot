import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { notifySecurityEvent } from "@/lib/notifications/triggers";

/**
 * POST /api/account/disconnect-google
 *
 * Safely removes the Google OAuth provider from the authenticated user's account.
 *
 * Safety checks:
 *  - User must be authenticated (session cookie).
 *  - User must have at least one other login method (email/password account)
 *    so they cannot be locked out after unlinking.
 *
 * What this does:
 *  - Removes the Google row from Better Auth's `accounts` collection.
 *  - Deletes the stored OAuth tokens (access token + refresh token) for Google.
 *  - Does NOT delete the user record, profile data, or applications.
 *  - Email/Password login continues to work.
 *
 * Response:
 *   { success: true, message: "Google account disconnected." }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate — always from the session cookie
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. List all linked accounts for this user
    const accounts = await auth.api.listUserAccounts({
      headers: req.headers,
    });

    // 3. Verify Google is actually linked
    const googleAccount = accounts.find(
      (acc: { providerId: string }) => acc.providerId === "google",
    );

    if (!googleAccount) {
      return NextResponse.json(
        {
          success: false,
          message: "No Google account is connected.",
        },
        { status: 400 },
      );
    }

    // 4. Safety check — user must have another login method (e.g., credential/email-password)
    //    to prevent account lockout after unlinking Google
    const hasOtherLoginMethod = accounts.some(
      (acc: { providerId: string }) => acc.providerId !== "google",
    );

    if (!hasOtherLoginMethod) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot disconnect Google — it is your only login method. Please set a password first.",
        },
        { status: 400 },
      );
    }

    // 5. Unlink the Google account — Better Auth removes the accounts row
    //    and clears stored OAuth tokens
    await auth.api.unlinkAccount({
      body: { providerId: "google" },
      headers: req.headers,
    });

    await notifySecurityEvent(session.user.id, "google_disconnected");

    return NextResponse.json({
      success: true,
      message: "Google account disconnected successfully.",
    });
  } catch (error) {
    console.error("[disconnect-google] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to disconnect Google account." },
      { status: 500 },
    );
  }
}
