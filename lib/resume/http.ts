import type { z } from "zod";
import { ResumeError } from "@/lib/resume/errors";
import { MIN_JD_CHARS } from "@/lib/resume/schemas";

/** Parses a JSON body with zod; failures become a user-safe 400. */
export async function parseJson<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ResumeError("VALIDATION", "The request body was not valid.");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ResumeError(
      "VALIDATION",
      first?.path.length
        ? `Please check the "${first.path.join(".")}" field and try again.`
        : "Please check your input and try again.",
    );
  }
  return result.data;
}

/** Validates the JD text: non-empty and long enough to analyse meaningfully. */
export function assertUsableJobDescription(text: string | undefined): string {
  const jd = (text ?? "").trim();
  if (!jd) {
    throw new ResumeError("EMPTY_JD", "Paste a job description (or upload a file) to continue.");
  }
  if (jd.length < MIN_JD_CHARS) {
    throw new ResumeError(
      "JD_TOO_SHORT",
      "That job description is too short to analyse. Paste the full posting.",
    );
  }
  return jd;
}

export function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}
