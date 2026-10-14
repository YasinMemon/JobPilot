import { NextResponse } from "next/server";
import type { ResumeErrorCode } from "@/types/resume";

/**
 * User-safe error for the resume feature. `message` is always safe to show;
 * raw provider/database errors are logged server-side and never forwarded.
 */
export class ResumeError extends Error {
  constructor(
    public code: ResumeErrorCode,
    message: string,
    public status = 400,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ResumeError";
  }
}

export function errorResponse(error: unknown, context: string) {
  if (error instanceof ResumeError) {
    return NextResponse.json(
      {
        success: false,
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.status },
    );
  }
  console.error(`[${context}]`, error instanceof Error ? error.message : error);
  return NextResponse.json(
    {
      success: false,
      code: "SERVER",
      message: "Something went wrong on our side. Please try again.",
    },
    { status: 500 },
  );
}
