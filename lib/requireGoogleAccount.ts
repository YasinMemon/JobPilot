import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export interface GoogleAccountInfo {
  /** Better Auth internal document ID — used to look up the account in MongoDB */
  recordId: string;
  /** Provider's external account ID (e.g. Google sub/user ID) */
  accountId: string;
  providerId: string;
}

export interface SessionWithGoogle {
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
  googleAccount: GoogleAccountInfo;
}

/**
 * Server-side guard for Gmail-dependent API routes.
 *
 * Usage:
 *   const result = await requireGoogleAccount(req);
 *   if (result instanceof NextResponse) return result;          // early 401/403
 *   const { session, googleAccount } = result;
 *
 * Returns a NextResponse error response if:
 *  - The user is unauthenticated (401)
 *  - No Google provider is linked (403 with requiresGoogle flag)
 *
 * Otherwise returns the session + google account info.
 */
export async function requireGoogleAccount(
  req: NextRequest,
): Promise<SessionWithGoogle | NextResponse> {
  // 1. Authenticate — always from the session cookie, never from frontend input
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  // 2. List all providers linked to this user
  const accounts = await auth.api.listUserAccounts({
    headers: req.headers,
  });

  // 3. Find the Google provider
  const googleAccount = accounts.find(
    (acc: { providerId: string }) => acc.providerId === "google",
  );

  if (!googleAccount) {
    return NextResponse.json(
      {
        success: false,
        requiresGoogle: true,
        message: "Please connect your Google account first.",
      },
      { status: 403 },
    );
  }

  return {
    session,
    googleAccount: {
      recordId: googleAccount.id,
      accountId: googleAccount.accountId,
      providerId: googleAccount.providerId,
    },
  };
}
