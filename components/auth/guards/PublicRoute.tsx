"use client";

/**
 * PublicRoute
 *
 * Layer 2 guard for public-only routes (login, register, forgot-password, etc.).
 *
 * Wraps auth layout content. On mount it calls authClient.useSession() to
 * check if the user is already authenticated.
 *
 * Behaviour:
 *  - While session is loading   → shows AuthLoadingScreen (prevents FOUC)
 *  - Session valid              → redirects to /dashboard (or callbackUrl)
 *  - No session                 → renders children (the public auth page)
 *
 * The `callbackUrl` search param is respected so post-login redirects work
 * correctly after being bounced through login by ProtectedRoute or proxy.ts.
 *
 * @see proxy.ts            — Layer 1: fast optimistic check
 * @see lib/auth/routeConfig.ts  — route classification
 */

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthLoadingScreen } from "./AuthLoadingScreen";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    if (session) {
      // Already authenticated — redirect to dashboard or the intended destination
      const callbackUrl = searchParams.get("callbackUrl");
      const destination =
        callbackUrl && callbackUrl.startsWith("/")
          ? callbackUrl
          : "/dashboard";
      router.replace(destination);
    }
  }, [session, isPending, router, searchParams]);

  // Show loading screen while session is being verified
  if (isPending) {
    return <AuthLoadingScreen />;
  }

  // Authenticated — show nothing while redirect is in-flight
  if (session) {
    return null;
  }

  // Not authenticated — render the public auth page
  return <>{children}</>;
}
