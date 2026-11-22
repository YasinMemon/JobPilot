import { google, type gmail_v1 } from "googleapis";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

/**
 * Gmail client for a given JobPilot user that works WITHOUT a browser
 * session (cron jobs) and keeps the stored OAuth tokens fresh.
 *
 * googleapis refreshes an expired access token automatically when a refresh
 * token is set; the `tokens` listener writes the new access token back to the
 * Better Auth `account` document so the next request/cron run reuses it.
 * Tokens are never logged or returned to callers other than as a client.
 */

export class GmailAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GmailAuthError";
  }
}

function userIdFilter(userId: string) {
  const variants: (string | ObjectId)[] = [userId];
  if (ObjectId.isValid(userId)) variants.push(new ObjectId(userId));
  return { userId: { $in: variants }, providerId: "google" };
}

export async function createGmailClientForUser(
  userId: string,
): Promise<gmail_v1.Gmail> {
  const mongo = await clientPromise;
  const accounts = mongo.db().collection("account");

  const account = await accounts.findOne(userIdFilter(userId));
  if (!account) {
    throw new GmailAuthError("No Google account is connected.");
  }
  if (!account.accessToken && !account.refreshToken) {
    throw new GmailAuthError("Google account has no stored tokens.");
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2.setCredentials({
    access_token: account.accessToken ?? undefined,
    refresh_token: account.refreshToken ?? undefined,
    expiry_date: account.accessTokenExpiresAt
      ? new Date(account.accessTokenExpiresAt as Date).getTime()
      : undefined,
  });

  oauth2.on("tokens", (tokens) => {
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (tokens.access_token) update.accessToken = tokens.access_token;
    if (tokens.expiry_date) {
      update.accessTokenExpiresAt = new Date(tokens.expiry_date);
    }
    if (tokens.refresh_token) update.refreshToken = tokens.refresh_token;
    accounts
      .updateOne({ _id: account._id }, { $set: update })
      .catch((err) =>
        console.error("[gmail] failed to persist refreshed token:", err?.message),
      );
  });

  return google.gmail({ version: "v1", auth: oauth2 });
}

// ─── Error classification & retry ─────────────────────────────────────────────

function errorStatus(err: unknown): number | undefined {
  const e = err as { code?: number | string; status?: number; response?: { status?: number } };
  const status = e?.response?.status ?? e?.status ?? e?.code;
  return typeof status === "number" ? status : undefined;
}

export function isAuthFailure(err: unknown): boolean {
  if (err instanceof GmailAuthError) return true;
  const message = String((err as Error)?.message ?? "");
  return (
    /invalid_grant|invalid_client|unauthorized_client/i.test(message) ||
    errorStatus(err) === 401
  );
}

export function isTransientGmailError(err: unknown): boolean {
  if (isAuthFailure(err)) return false;
  const status = errorStatus(err);
  if (status === 429 || (status !== undefined && status >= 500)) return true;
  if (status === 403) {
    // Gmail signals quota/rate limiting with 403 + a rateLimit reason.
    return /rate ?limit|quota|userRateLimitExceeded/i.test(
      String((err as Error)?.message ?? ""),
    );
  }
  const code = String((err as { code?: unknown })?.code ?? "");
  return /ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|ECONNREFUSED/.test(code);
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Retries transient Gmail failures (429 / 5xx / rate-limit 403 / network)
 * with exponential backoff + jitter. Permanent errors are thrown at once.
 */
export async function withGmailRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseDelayMs?: number; sleepFn?: (ms: number) => Promise<void> } = {},
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const base = opts.baseDelayMs ?? 500;
  const wait = opts.sleepFn ?? sleep;

  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientGmailError(err) || i === attempts - 1) throw err;
      await wait(base * 2 ** i + Math.floor(Math.random() * 100));
    }
  }
  throw lastErr;
}
