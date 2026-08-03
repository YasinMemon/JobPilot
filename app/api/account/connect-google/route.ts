import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/account/connect-google
 *
 * Returns the Google OAuth authorization URL for the authenticated user.
 * The frontend should redirect to this URL to begin the OAuth flow.
 *
 * Better Auth's /api/auth/link-social endpoint handles the actual OAuth dance
 * and links the Google account to the existing user — no duplicate users are created.
 *
 * Body: { callbackURL?: string }
 *
 * Response:
 *   { url: "https://accounts.google.com/o/oauth2/auth?..." }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify session — never trust userId from frontend
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Check if Google is already linked (idempotency guard)
    const accounts = await auth.api.listUserAccounts({
      headers: req.headers,
    });

    const alreadyLinked = accounts.some(
      (acc: { providerId: string }) => acc.providerId === "google",
    );

    if (alreadyLinked) {
      return NextResponse.json({
        success: false,
        message: "Google account is already connected.",
      });
    }

    // 3. Get the callbackURL from the request body (optional)
    const body = await req.json().catch(() => ({}));
    const callbackURL =
      body.callbackURL ?? "/dashboard/settings?tab=connected-accounts";

    // 4. Use Better Auth's link-social endpoint server-side to get the OAuth URL
    //    This stores the userId in the state parameter so the callback associates
    //    the Google account with the correct user — no new user is created.
    const linkResponse = await auth.api.linkSocialAccount({
      body: {
        provider: "google",
        callbackURL,
        disableRedirect: true, // Return URL instead of redirecting from the server
      },
      headers: req.headers,
    });

    return NextResponse.json({
      success: true,
      url: linkResponse.url,
    });
  } catch (error) {
    console.error("[connect-google] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate Google authorization URL" },
      { status: 500 },
    );
  }
}
