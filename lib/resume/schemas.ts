import { z } from "zod";
import { RESUME_SECTIONS, SKILL_CATEGORIES } from "@/types/resume";

/**
 * zod schemas for every payload that crosses the resume API boundary.
 * Strings are trimmed and length-capped so stored documents stay bounded.
 */

const s = (max = 300) => z.string().trim().max(max).default("");
const list = (itemMax = 200, maxItems = 40) =>
  z.array(z.string().trim().max(itemMax)).max(maxItems).default([]);
const id = z.string().trim().min(1).max(64);

export const personalSchema = z.object({
  fullName: s(120),
  email: s(160),
  phone: s(40),
  location: s(120),
  linkedin: s(300),
  github: s(300),
  portfolio: s(300),
  otherLinks: z
    .array(z.object({ label: s(60), url: s(300) }))
    .max(10)
    .default([]),
});

export const experienceSchema = z.object({
  id,
  company: s(160),
  title: s(160),
  employmentType: s(60),
  location: s(120),
  startDate: s(30),
  endDate: s(30),
  current: z.boolean().default(false),
  description: s(2000),
  achievements: list(600, 20),
  technologies: list(60, 40),
});

export const educationSchema = z.object({
  id,
  institution: s(200),
  degree: s(160),
  field: s(160),
  startDate: s(30),
  endDate: s(30),
  grade: s(60),
});

export const skillsSchema = z.object({
  programmingLanguages: list(60, 60),
  frontend: list(60, 60),
  backend: list(60, 60),
  databases: list(60, 60),
  cloudDevOps: list(60, 60),
  tools: list(60, 60),
  frameworks: list(60, 60),
  other: list(60, 60),
});
// Keep the schema in sync with the shared category list
void SKILL_CATEGORIES;

export const projectSchema = z.object({
  id,
  name: s(160),
  description: s(2000),
  technologies: list(60, 40),
  responsibilities: list(600, 20),
  achievements: list(600, 20),
  url: s(300),
  githubUrl: s(300),
});

export const certificationSchema = z.object({
  id,
  name: s(200),
  issuer: s(160),
  date: s(30),
  url: s(300),
});

export const achievementSchema = z.object({
  id,
  title: s(200),
  description: s(1000),
});

export const resumeProfileSchema = z.object({
  personal: personalSchema,
  summary: s(2000),
  experience: z.array(experienceSchema).max(30).default([]),
  education: z.array(educationSchema).max(10).default([]),
  skills: skillsSchema,
  projects: z.array(projectSchema).max(30).default([]),
  certifications: z.array(certificationSchema).max(30).default([]),
  achievements: z.array(achievementSchema).max(30).default([]),
});

// ─── Resume content ───────────────────────────────────────────────────────────

const sectionKey = z.enum(RESUME_SECTIONS);

export const resumeContentSchema = z.object({
  personal: personalSchema,
  summary: s(2000),
  experience: z
    .array(
      z.object({
        id,
        company: s(160),
        title: s(160),
        employmentType: s(60),
        location: s(120),
        startDate: s(30),
        endDate: s(30),
        current: z.boolean().default(false),
        bullets: list(700, 20),
      }),
    )
    .max(30)
    .default([]),
  projects: z
    .array(
      z.object({
        id,
        name: s(160),
        technologies: list(60, 40),
        url: s(300),
        githubUrl: s(300),
        bullets: list(700, 20),
      }),
    )
    .max(30)
    .default([]),
  skills: z
    .array(z.object({ id, category: s(80), items: list(60, 60) }))
    .max(20)
    .default([]),
  education: z.array(educationSchema).max(10).default([]),
  certifications: z.array(certificationSchema).max(30).default([]),
  achievements: z.array(achievementSchema).max(30).default([]),
  sectionOrder: z.array(sectionKey).max(7).default([...RESUME_SECTIONS]),
  hiddenSections: z.array(sectionKey).max(7).default([]),
});

// ─── JD analysis ──────────────────────────────────────────────────────────────

export const jdAnalysisSchema = z.object({
  jobTitle: s(160),
  company: s(160),
  experience: s(120),
  employmentType: s(60),
  location: s(160),
  workMode: s(60),
  requiredSkills: list(80, 60),
  preferredSkills: list(80, 60),
  skillGroups: z
    .object({
      technical: list(80, 60),
      languages: list(80, 60),
      frameworks: list(80, 60),
      databases: list(80, 60),
      tools: list(80, 60),
      cloud: list(80, 60),
      soft: list(80, 60),
    })
    .default({
      technical: [],
      languages: [],
      frameworks: [],
      databases: [],
      tools: [],
      cloud: [],
      soft: [],
    }),
  responsibilities: list(400, 30),
  qualifications: z
    .object({
      education: list(300, 15),
      experience: list(300, 15),
      certifications: list(300, 15),
      other: list(300, 15),
    })
    .default({ education: [], experience: [], certifications: [], other: [] }),
  keywords: z
    .array(
      z.object({
        term: z.string().trim().min(1).max(80),
        importance: z
          .enum(["required", "preferred", "important", "nice_to_have"])
          .catch("important"),
      }),
    )
    .max(80)
    .default([]),
  matchedSkills: list(80, 80),
  missingSkills: list(80, 80),
});

export const matchBreakdownSchema = z.object({
  overall: z.number().min(0).max(100).default(0),
  skills: z.number().min(0).max(100).default(0),
  keywords: z.number().min(0).max(100).default(0),
  experience: z.number().min(0).max(100).default(0),
  projects: z.number().min(0).max(100).default(0),
  education: z.number().min(0).max(100).default(0),
});

// ─── Request bodies ───────────────────────────────────────────────────────────

export const MAX_JD_CHARS = 15000;
export const MIN_JD_CHARS = 80;

export const templateSchema = z.enum([
  "ats-classic",
  "modern-developer",
  "compact",
]);

export const generateBodySchema = z.object({
  jobDescription: z.string().max(MAX_JD_CHARS * 2).default(""),
  analysis: jdAnalysisSchema.optional(),
});

export const improveBodySchema = z.object({
  action: z.enum([
    "improve",
    "concise",
    "ats",
    "technical",
    "leadership",
    "relevant",
    "stronger",
    "rewrite-summary",
  ]),
  /** The single piece of text being improved (a bullet or the summary). */
  text: z.string().trim().min(1).max(1500),
  /** Which resume item the text belongs to — used to ground the rewrite. */
  target: z.object({
    section: z.enum(["summary", "experience", "projects"]),
    itemId: z.string().trim().max(64).optional(),
  }),
  analysis: jdAnalysisSchema.optional(),
});

export const matchBodySchema = z.object({
  content: resumeContentSchema,
  analysis: jdAnalysisSchema,
});

export const saveResumeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(140),
  targetJobTitle: s(160),
  targetCompany: s(160),
  jobUrl: s(500),
  jobDescription: z.string().max(MAX_JD_CHARS).default(""),
  jdAnalysis: jdAnalysisSchema,
  content: resumeContentSchema,
  template: templateSchema.default("ats-classic"),
  matchScore: z.number().min(0).max(100).default(0),
  matchBreakdown: matchBreakdownSchema,
  missingSkills: list(80, 80),
});

export const updateResumeSchema = z.object({
  name: saveResumeSchema.shape.name.optional(),
  targetJobTitle: saveResumeSchema.shape.targetJobTitle.optional(),
  targetCompany: saveResumeSchema.shape.targetCompany.optional(),
  jobUrl: saveResumeSchema.shape.jobUrl.optional(),
  jobDescription: saveResumeSchema.shape.jobDescription.optional(),
  jdAnalysis: jdAnalysisSchema.optional(),
  content: resumeContentSchema.optional(),
  template: templateSchema.optional(),
  matchScore: saveResumeSchema.shape.matchScore.optional(),
  matchBreakdown: matchBreakdownSchema.optional(),
  missingSkills: saveResumeSchema.shape.missingSkills.optional(),
});

export const exportBodySchema = z.object({
  format: z.enum(["pdf", "docx"]),
});
