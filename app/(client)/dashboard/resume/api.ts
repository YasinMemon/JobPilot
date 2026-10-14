import type {
  JDAnalysis,
  MatchBreakdown,
  ResumeContent,
  ResumeErrorCode,
  ResumeProfileData,
  SavePayload,
  SavedResume,
  SavedResumeSummary,
  ImproveAction,
} from "@/types/resume";

/** Error thrown by every call below. `message` is always safe to display. */
export class ResumeApiError extends Error {
  constructor(
    message: string,
    public code: ResumeErrorCode | "NETWORK",
    public details?: { gaps?: string[] },
  ) {
    super(message);
    this.name = "ResumeApiError";
  }
}

const NETWORK_MESSAGE =
  "Couldn't reach the server. Check your connection and try again.";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: "include", ...init });
  } catch {
    throw new ResumeApiError(NETWORK_MESSAGE, "NETWORK");
  }

  let body: { success?: boolean; data?: T; message?: string; code?: ResumeErrorCode; details?: { gaps?: string[] } } | null = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok || !body?.success) {
    throw new ResumeApiError(
      body?.message || "Something went wrong. Please try again.",
      body?.code ?? "SERVER",
      body?.details,
    );
  }
  return body.data as T;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile() {
  let res: Response;
  try {
    res = await fetch("/api/resume/profile", { credentials: "include" });
  } catch {
    throw new ResumeApiError(NETWORK_MESSAGE, "NETWORK");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new ResumeApiError(body?.message || "Couldn't load your profile.", body?.code ?? "SERVER");
  }
  return body as { data: ResumeProfileData; seeded: boolean; gaps: string[] };
}

export async function saveProfile(profile: ResumeProfileData) {
  let res: Response;
  try {
    res = await fetch("/api/resume/profile", {
      credentials: "include",
      ...json("PUT", profile),
    });
  } catch {
    throw new ResumeApiError(NETWORK_MESSAGE, "NETWORK");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new ResumeApiError(body?.message || "Couldn't save your profile.", body?.code ?? "SERVER");
  }
  return body as { data: ResumeProfileData; gaps: string[] };
}

// ─── JD + generation ──────────────────────────────────────────────────────────

export interface JDInput {
  jobDescription: string;
  jobTitle?: string;
  company?: string;
  location?: string;
}

export function analyzeJD(input: JDInput) {
  return request<{ analysis: JDAnalysis; jobDescription: string }>(
    "/api/resume/analyze-jd",
    json("POST", input),
  );
}

export function analyzeJDFile(file: File, hints: Omit<JDInput, "jobDescription">) {
  const form = new FormData();
  form.append("file", file);
  for (const [k, v] of Object.entries(hints)) if (v) form.append(k, v);
  return request<{ analysis: JDAnalysis; jobDescription: string }>(
    "/api/resume/analyze-jd",
    { method: "POST", body: form },
  );
}

export interface GenerateResult {
  content: ResumeContent;
  analysis: JDAnalysis;
  matchBreakdown: MatchBreakdown;
  matchScore: number;
  missingSkills: string[];
}

export function generateResume(jobDescription: string, analysis: JDAnalysis) {
  return request<GenerateResult>(
    "/api/resume/generate",
    json("POST", { jobDescription, analysis }),
  );
}

export function recomputeMatch(content: ResumeContent, analysis: JDAnalysis) {
  return request<Omit<GenerateResult, "content">>(
    "/api/resume/match",
    json("POST", { content, analysis }),
  );
}

export function improveText(params: {
  action: ImproveAction;
  text: string;
  target: { section: "summary" | "experience" | "projects"; itemId?: string };
  analysis?: JDAnalysis;
}) {
  return request<{ text: string }>("/api/resume/improve-section", json("POST", params));
}

// ─── Saved resumes ────────────────────────────────────────────────────────────

export const listResumes = () => request<SavedResumeSummary[]>("/api/resumes");
export const getResume = (id: string) => request<SavedResume>(`/api/resumes/${id}`);
export const createResume = (payload: SavePayload) =>
  request<SavedResume>("/api/resumes", json("POST", payload));
export const updateResume = (id: string, payload: Partial<SavePayload>) =>
  request<SavedResume>(`/api/resumes/${id}`, json("PUT", payload));
export const duplicateResume = (id: string) =>
  request<SavedResume>("/api/resumes", json("POST", { duplicateFromId: id }));
export const deleteResume = (id: string) =>
  request<null>(`/api/resumes/${id}`, { method: "DELETE" });

export async function downloadResume(id: string, format: "pdf" | "docx", fallbackName: string) {
  let res: Response;
  try {
    res = await fetch(`/api/resumes/${id}/export`, {
      credentials: "include",
      ...json("POST", { format }),
    });
  } catch {
    throw new ResumeApiError(NETWORK_MESSAGE, "NETWORK");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ResumeApiError(
      body?.message || `We couldn't generate the ${format.toUpperCase()} file. Please try again.`,
      body?.code ?? "EXPORT_FAILED",
    );
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match?.[1] ?? `${fallbackName}.${format}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
