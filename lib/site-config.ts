/**
 * Central site configuration for JobPilot.
 * Keep all public-facing constants here so changes propagate everywhere.
 */

// ---------------------------------------------------------------------------
// Domain & contact
// ---------------------------------------------------------------------------
export const SITE_URL = "https://jobpilot.cc";

/**
 * Support email address.
 * Override with NEXT_PUBLIC_SUPPORT_EMAIL env var in production if needed.
 */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "memonyasin2007@gmail.com";
