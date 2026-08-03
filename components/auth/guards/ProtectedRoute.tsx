"use client";

/**
 * ProtectedRoute
 *
 * Layer 2 of route protection (client-side, secure).
 *
 * Wraps protected layout content. On mount it calls authClient.useSession()
 * which validates the session cookie against the database via better-auth.
 *
 * Behaviour:
 *  - While session is loading   → shows AuthLoadingScreen (prevents FOUC)
 *  - Session missing / expired  → signs out + redirects to /login (auto-logout)
 *  - Session valid              → renders children
 *
 * This component must NOT be used in Server Components — it relies on
 * React hooks and client-side navigation.
 *
 * @see proxy.ts            — Layer 1: fast cookie-only optimistic check
 * @see lib/auth/routeConfig.ts  — route classification
 */

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthLoadingScreen } from "./AuthLoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    // Only act once loading is complete
    if (isPending) return;

    if (!session) {
      // Session is missing or expired — auto-logout and redirect to login
      // Include the current path as callbackUrl so user returns after login
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);
    }
  }, [session, isPending, router, pathname]);

  // Show loading screen while session is being verified
  if (isPending) {
    return <AuthLoadingScreen />;
  }

  // Session is invalid — show nothing while redirect is in-flight
  if (!session) {
    return null;
  }

  // Authenticated — render the protected content
  return <>{children}</>;
}
