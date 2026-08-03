/**
 * proxy.ts  (Next.js 16 — replaces the deprecated middleware.ts)
 *
 * Layer 1 of route protection: fast, optimistic session check using only the
 * session cookie presence — no database round-trip.
 *
 * Two responsibilities:
 *  1. Redirect unauthenticated users away from protected routes → /login
 *  2. Redirect authenticated users away from public-only routes → /dashboard
 *
 * Secure session validation (DB-backed) happens in the client-side guards
 * (ProtectedRoute / PublicRoute) inside the layout components — that is Layer 2.
 *
 * @see lib/auth/routeConfig.ts  — route classification config
 * @see https://www.better-auth.com/docs/integrations/next-js
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { isProtectedRoute, isPublicOnlyRoute } from "@/lib/auth/routeConfig";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for a session cookie (optimistic — no DB call)
  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = Boolean(sessionCookie);

  // ── 1. Protected route without a session → redirect to login ─────────────
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the intended destination so we can redirect back after login
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 2. Public-only route with an active session → redirect to dashboard ──
  if (isPublicOnlyRoute(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   - _next/static  (static assets)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     *   - /api routes   (Better Auth and other API handlers protect themselves)
     *   - public folder files (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)",
  ],
};
