import type { SavedResume, SavedResumeSummary } from "@/types/resume";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : String(d ?? ""));

export function serializeResume(doc: Doc): SavedResume {
  return {
    _id: String(doc._id),
    name: doc.name,
    targetJobTitle: doc.targetJobTitle ?? "",
    targetCompany: doc.targetCompany ?? "",
    jobUrl: doc.jobUrl ?? "",
    jobDescription: doc.jobDescription ?? "",
    jdAnalysis: doc.jdAnalysis,
    content: doc.content,
    template: doc.template,
    matchScore: doc.matchScore ?? 0,
    matchBreakdown: doc.matchBreakdown,
    missingSkills: doc.missingSkills ?? [],
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function serializeResumeSummary(doc: Doc): SavedResumeSummary {
  return {
    _id: String(doc._id),
    name: doc.name,
    targetJobTitle: doc.targetJobTitle ?? "",
    targetCompany: doc.targetCompany ?? "",
    template: doc.template,
    matchScore: doc.matchScore ?? 0,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}
