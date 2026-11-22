import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Verifies `Authorization: Bearer $CRON_SECRET` (what Vercel Cron sends when
 * CRON_SECRET is set). Fails closed when the secret is not configured.
 */
export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
