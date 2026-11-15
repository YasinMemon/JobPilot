/**
 * Shared (client + server) types for the AI Resume Generator.
 */

// ─── Profile (source of truth the AI may draw from) ───────────────────────────

export interface ResumeLink {
  label: string;
  url: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  otherLinks: ResumeLink[];
}

export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  employmentType: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
  technologies: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade: string;
}

export const SKILL_CATEGORIES = [
  "programmingLanguages",
  "frontend",
  "backend",
  "databases",
  "cloudDevOps",
  "tools",
  "frameworks",
  "other",
] as const;

export type SkillCategoryKey = (typeof SKILL_CATEGORIES)[number];

export const SKILL_CATEGORY_LABELS: Record<SkillCategoryKey, string> = {
  programmingLanguages: "Programming Languages",
  frontend: "Frontend",
  backend: "Backend",
  databases: "Databases",
  cloudDevOps: "Cloud / DevOps",
  tools: "Tools",
  frameworks: "Frameworks",
  other: "Other",
};

export type ProfileSkills = Record<SkillCategoryKey, string[]>;

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  responsibilities: string[];
  achievements: string[];
  url: string;
  githubUrl: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
}

export interface ResumeProfileData {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: ProfileSkills;
  projects: ProjectItem[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
}

// ─── JD analysis ──────────────────────────────────────────────────────────────

export type KeywordImportance =
  | "required"
  | "preferred"
  | "important"
  | "nice_to_have";

export interface JDKeyword {
  term: string;
  importance: KeywordImportance;
}

export interface JDSkillGroups {
  technical: string[];
  languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  cloud: string[];
  soft: string[];
}

export interface JDQualifications {
  education: string[];
  experience: string[];
  certifications: string[];
  other: string[];
}

export interface JDAnalysis {
  jobTitle: string;
  company: string;
  experience: string;
  employmentType: string;
  location: string;
  workMode: string;
  requiredSkills: string[];
  preferredSkills: string[];
  skillGroups: JDSkillGroups;
  responsibilities: string[];
  qualifications: JDQualifications;
  keywords: JDKeyword[];
  /** Computed against the user's profile — never produced by the AI. */
  matchedSkills: string[];
  missingSkills: string[];
}

// ─── Generated resume content ─────────────────────────────────────────────────

export const RESUME_SECTIONS = [
  "summary",
  "experience",
  "projects",
  "skills",
  "education",
  "certifications",
  "achievements",
] as const;

export type ResumeSectionKey = (typeof RESUME_SECTIONS)[number];

export const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: "Professional Summary",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  education: "Education",
  certifications: "Certifications",
  achievements: "Achievements",
};

export interface ResumeExperience {
  id: string;
  company: string;
  title: string;
  employmentType: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface ResumeProject {
  id: string;
  name: string;
  technologies: string[];
  url: string;
  githubUrl: string;
  bullets: string[];
}

export interface ResumeSkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface ResumeContent {
  personal: PersonalInfo;
  summary: string;
  experience: ResumeExperience[];
  projects: ResumeProject[];
  skills: ResumeSkillGroup[];
  education: EducationItem[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
  sectionOrder: ResumeSectionKey[];
  hiddenSections: ResumeSectionKey[];
}

export type ResumeTemplateKey = "ats-classic" | "modern-developer" | "compact";

export const RESUME_TEMPLATES: {
  key: ResumeTemplateKey;
  name: string;
  description: string;
}[] = [
  {
    key: "ats-classic",
    name: "ATS Classic",
    description: "Minimal black-and-white, serif. Maximum parser compatibility.",
  },
  {
    key: "modern-developer",
    name: "Modern Developer",
    description: "Clean sans-serif with a subtle accent color.",
  },
  {
    key: "compact",
    name: "Compact",
    description: "Tighter spacing to fit more on one page.",
  },
];

// ─── Match score ──────────────────────────────────────────────────────────────

export interface MatchBreakdown {
  overall: number;
  skills: number;
  keywords: number;
  experience: number;
  projects: number;
  education: number;
}

// ─── Saved resume ─────────────────────────────────────────────────────────────

export interface SavedResume {
  _id: string;
  name: string;
  targetJobTitle: string;
  targetCompany: string;
  jobUrl: string;
  jobDescription: string;
  jdAnalysis: JDAnalysis;
  content: ResumeContent;
  template: ResumeTemplateKey;
  matchScore: number;
  matchBreakdown: MatchBreakdown;
  missingSkills: string[];
  createdAt: string;
  updatedAt: string;
}

/** Lightweight row for the "My Resumes" list. */
export type SavedResumeSummary = Pick<
  SavedResume,
  | "_id"
  | "name"
  | "targetJobTitle"
  | "targetCompany"
  | "template"
  | "matchScore"
  | "createdAt"
  | "updatedAt"
>;

export type SavePayload = Pick<
  SavedResume,
  | "name"
  | "targetJobTitle"
  | "targetCompany"
  | "jobUrl"
  | "jobDescription"
  | "jdAnalysis"
  | "content"
  | "template"
  | "matchScore"
  | "matchBreakdown"
  | "missingSkills"
>;

// ─── AI improvement actions ───────────────────────────────────────────────────

export const IMPROVE_ACTIONS = [
  { key: "improve", label: "Improve wording" },
  { key: "concise", label: "Make more concise" },
  { key: "ats", label: "Make more ATS-friendly" },
  { key: "technical", label: "Highlight technical impact" },
  { key: "leadership", label: "Highlight leadership" },
  { key: "relevant", label: "Highlight relevant experience" },
  { key: "stronger", label: "Generate stronger bullet" },
  { key: "rewrite-summary", label: "Rewrite summary" },
] as const;

export type ImproveAction = (typeof IMPROVE_ACTIONS)[number]["key"];

/** Stable error codes returned by the resume APIs. */
export type ResumeErrorCode =
  | "EMPTY_JD"
  | "JD_TOO_SHORT"
  | "INVALID_FILE"
  | "PROFILE_INSUFFICIENT"
  | "AI_FAILED"
  | "RATE_LIMITED"
  | "EXPORT_FAILED"
  | "PDF_UNSUPPORTED_TEXT"
  | "VALIDATION"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "SERVER";
