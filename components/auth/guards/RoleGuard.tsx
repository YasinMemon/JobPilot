"use client";

/**
 * RoleGuard
 *
 * Role-based authorization guard for route segments that require a specific role.
 *
 * Wraps content that should only be accessible to users with certain roles.
 * Must be used INSIDE a ProtectedRoute (i.e., session is already verified).
 *
 * Behaviour:
 *  - While session is loading   → shows AuthLoadingScreen
 *  - User role is in allowedRoles → renders children
 *  - User role NOT in allowedRoles → renders UnauthorizedPage (403)
 *
 * Usage:
 *   <RoleGuard allowedRoles={["admin"]}>
 *     <AdminPanel />
 *   </RoleGuard>
 *
 * @see lib/auth/routeConfig.ts  — ROLE_REQUIRED_ROUTES config
 * @see app/unauthorized/page.tsx — 403 page
 */

import { authClient } from "@/lib/auth-client";
import { AuthLoadingScreen } from "./AuthLoadingScreen";
import type { AppRole } from "@/lib/auth/routeConfig";

interface RoleGuardProps {
  /** Roles that are permitted to view this content. */
  allowedRoles: AppRole[];
  children: React.ReactNode;
  /** Optional custom fallback instead of the default 403 page. */
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <AuthLoadingScreen />;
  }

  // No session — ProtectedRoute should have already handled this,
  // but guard defensively just in case.
  if (!session) {
    return null;
  }

  const userRole = (session.user as { role?: AppRole }).role;
  const isAuthorized = userRole ? allowedRoles.includes(userRole) : false;

  if (!isAuthorized) {
    // Render custom fallback or the global 403 page inline
    return fallback ? <>{fallback}</> : <UnauthorizedInline />;
  }

  return <>{children}</>;
}

// ─── Inline 403 component ─────────────────────────────────────────────────────
// Used when RoleGuard blocks access within a page/section, rather than a
// full-page redirect. For full-page protection use the /unauthorized route.

function UnauthorizedInline() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#27272a] bg-[#111111]">
        <svg
          className="h-8 w-8 text-zinc-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      {/* Copy */}
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-widest text-zinc-600">
          403 — Forbidden
        </p>
        <h2 className="mt-2 text-[20px] font-bold text-white">
          Access Denied
        </h2>
        <p className="mt-2 max-w-sm text-[13px] text-zinc-400">
          You don&apos;t have permission to view this content. Contact your
          administrator if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}
