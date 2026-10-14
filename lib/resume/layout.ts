import type {
  ResumeContent,
  ResumeSectionKey,
  EducationItem,
  CertificationItem,
} from "@/types/resume";

/**
 * Shared, renderer-agnostic helpers: decide which sections appear, in what
 * order, and how dates/contact lines are formatted. The HTML preview, PDF and
 * DOCX exporters all use these so they stay consistent.
 */

export function sectionHasContent(
  content: ResumeContent,
  key: ResumeSectionKey,
): boolean {
  switch (key) {
    case "summary":
      return Boolean(content.summary.trim());
    case "experience":
      return content.experience.length > 0;
    case "projects":
      return content.projects.length > 0;
    case "skills":
      return content.skills.some((g) => g.items.length > 0);
    case "education":
      return content.education.length > 0;
    case "certifications":
      return content.certifications.length > 0;
    case "achievements":
      return content.achievements.length > 0;
  }
}

/** Sections to render: user order, not hidden, and non-empty. */
export function visibleSections(content: ResumeContent): ResumeSectionKey[] {
  const hidden = new Set(content.hiddenSections);
  return content.sectionOrder.filter(
    (k) => !hidden.has(k) && sectionHasContent(content, k),
  );
}

export function contactItems(content: ResumeContent): string[] {
  const p = content.personal;
  return [p.email, p.phone, p.location].map((s) => s.trim()).filter(Boolean);
}

export function linkItems(content: ResumeContent): string[] {
  const p = content.personal;
  return [
    p.linkedin,
    p.github,
    p.portfolio,
    ...p.otherLinks.map((l) => l.url),
  ]
    .map((s) => s.trim())
    .filter(Boolean);
}

export function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

export function dateRange(
  start: string,
  end: string,
  current: boolean,
): string {
  const s = start.trim();
  const e = current ? "Present" : end.trim();
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

export function educationDates(e: EducationItem): string {
  return dateRange(e.startDate, e.endDate, false);
}

export function certMeta(c: CertificationItem): string {
  return [c.issuer, c.date].map((s) => s.trim()).filter(Boolean).join(" | ");
}

export function safeFileName(name: string): string {
  const base = name
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return base || "resume";
}
