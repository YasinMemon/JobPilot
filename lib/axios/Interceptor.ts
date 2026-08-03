import { api } from "./client";

// ─── Request interceptor ──────────────────────────────────────────────────────
// better-auth uses httpOnly cookies, so the session is sent automatically via
// withCredentials: true (configured in client.ts).
// This interceptor is a no-op for auth but kept for custom token scenarios.
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ─── Response interceptor — auto-logout on 401 ───────────────────────────────
// When the server returns 401 (expired / invalid session), sign the user out
// and redirect to the login page. This handles sessions that expire while the
// app is already open, without the user navigating to a new page.
api.interceptors.response.use(
  // Pass through successful responses
  (response) => response,

  async (error) => {
    const status = error?.response?.status;
    const requestUrl: string = error?.config?.url ?? "";

    // Only handle 401 errors, and skip auth endpoints to avoid redirect loops
    if (
      status === 401 &&
      !requestUrl.includes("/api/auth/") &&
      typeof window !== "undefined"
    ) {
      try {
        // Dynamically import auth client to avoid circular dependency issues
        const { authClient } = await import("@/lib/auth-client");
        await authClient.signOut();
      } catch {
        // If sign-out fails, proceed with redirect anyway
      }

      // Preserve the current path as callbackUrl for post-login redirect
      const callbackUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?callbackUrl=${callbackUrl}`;
    }

    return Promise.reject(error);
  },
);