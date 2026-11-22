import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import type { ZodType } from "zod";
import { auth } from "@/lib/auth";
import { FollowUpError } from "@/services/followup.service";

export type IdContext = { params: Promise<{ id: string }> };

export interface FollowUpAuth {
  userId: string;
  userName: string;
}

/**
 * The user id ALWAYS comes from the Better Auth session — never from the
 * body, query or path — so a user can only reach their own tracked emails.
 */
export async function requireFollowUpUser(
  req: NextRequest,
): Promise<FollowUpAuth | NextResponse> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.user.id, userName: session.user.name ?? "" };
}

export async function readJson<T>(
  req: NextRequest,
  schema: ZodType<T>,
): Promise<T | NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid request",
      },
      { status: 400 },
    );
  }
  return parsed.data;
}

export async function resolveId(context: IdContext): Promise<string | NextResponse> {
  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
  }
  return id;
}

/** Maps service errors to JSON responses; anything unexpected becomes a 500. */
export function errorResponse(label: string, error: unknown): NextResponse {
  if (error instanceof FollowUpError) {
    return NextResponse.json(
      { success: false, code: error.code, message: error.message },
      { status: error.status },
    );
  }
  console.error(`[${label}] Error:`, error);
  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 },
  );
}

export const noStore = { "Cache-Control": "private, no-store" };
