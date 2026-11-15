import { auth } from "@/lib/auth";
import ConnectDB from "@/lib/db";
import userModel from "@/models/user";
import * as aiRepo from "@/repositories/ai.repository";
import { ResumeError } from "@/lib/resume/errors";

export interface ResumeSessionUser {
  /** Better-Auth user id — the ownership key on every resume document. */
  id: string;
  name?: string | null;
  email?: string | null;
}

/**
 * Resolves the authenticated user from the Better-Auth session.
 * Throws a 401 ResumeError when there is no session. Reuses the app's
 * existing auth — no second system.
 */
export async function requireResumeUser(
  headers: Headers,
): Promise<ResumeSessionUser> {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) {
    throw new ResumeError("UNAUTHORIZED", "Please sign in to continue.", 401);
  }
  await ConnectDB();
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
}

/**
 * Applies the shared daily AI credit limit (same one used by the AI
 * assistant). Returns a recorder to call once the AI work succeeded.
 */
const noopRecorder = async (): Promise<void> => {};

export async function reserveAICredit(
  authUserId: string,
): Promise<(tokens?: number) => Promise<void>> {
  const doc = await userModel
    .findOne({ authUserId })
    .select("_id")
    .lean<{ _id: unknown }>();
  if (!doc) return noopRecorder;

  const userId = String(doc._id);
  const allowed = await aiRepo.canUserSendMessage(userId);
  if (!allowed) {
    throw new ResumeError(
      "RATE_LIMITED",
      "You've reached today's AI limit. Credits reset at midnight.",
      429,
    );
  }
  return async (tokens = 0) => {
    try {
      await aiRepo.incrementUsage(userId, tokens);
    } catch (err) {
      console.error("[resume] usage tracking failed", err);
    }
  };
}
