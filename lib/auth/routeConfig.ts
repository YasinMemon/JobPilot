/**
 * routeConfig.ts
 *
 * Single source of truth for route classification across the application.
 *
 * Architecture:
 * - `PROTECTED_PREFIXES`  — routes that require authentication (prefix-matched)
 * - `PUBLIC_ONLY_ROUTES`  — routes only accessible to unauthenticated users
 * - `ROLE_REQUIRED_ROUTES` — routes that additionally require a specific role
 *
 * Adding a new protected route: add its prefix to PROTECTED_PREFIXES.
 * Adding a role-gated route: add it to ROLE_REQUIRED_ROUTES with the allowed roles.
 * No other files need to change.
 */

// ─── Route Classification ─────────────────────────────────────────────────────

/**
 * Route prefixes that require a valid session.
 * Matched with `startsWith` so /dashboard covers all sub-routes.
 */
export const PROTECTED_PREFIXES = ["/dashboard"] as const;

/**
 * Exact routes that are only accessible to unauthenticated users.
 * Authenticated users visiting these are redirected to /dashboard.
 */
export const PUBLIC_ONLY_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

// ─── Role-Based Access Control ────────────────────────────────────────────────

/**
 * Application roles — must stay in sync with the `role` field in types/user.ts.
 */
export type AppRole = "user" | "admin";

/**
 * Maps route prefixes to the roles that are allowed to access them.
 * Any authenticated user with a role NOT in the array will see the 403 page.
 *
 * Example (uncomment when admin routes exist):
 *   "/dashboard/admin": ["admin"],
 */
export const ROLE_REQUIRED_ROUTES: Record<string, AppRole[]> = {
  // "/dashboard/admin": ["admin"],
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Returns true if the given path is a protected route that requires auth.
 */
export function isProtectedRoute(path: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Returns true if the given path is a public-only route
 * (should redirect authenticated users away).
 */
export function isPublicOnlyRoute(path: string): boolean {
  return PUBLIC_ONLY_ROUTES.some((route) => path.startsWith(route));
}

/**
 * Returns the roles required to access the given path, or null if no
 * role restriction applies (any authenticated user may access it).
 */
export function getRequiredRoles(path: string): AppRole[] | null {
  const matchedRoute = Object.keys(ROLE_REQUIRED_ROUTES).find((route) =>
    path.startsWith(route),
  );
  return matchedRoute ? ROLE_REQUIRED_ROUTES[matchedRoute] : null;
}

/**
 * Returns true if the given role satisfies the route's role requirement.
 */
export function hasRequiredRole(
  userRole: AppRole | undefined,
  requiredRoles: AppRole[],
): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}
