import { randomUUID } from "crypto";
import { z } from "zod";
import groq from "@/lib/ai/groq";
import { ResumeError } from "@/lib/resume/errors";
import { checkGrounding } from "@/lib/resume/grounding";
import {
  computeSkillGap,
  jdTechnicalSkills,
  profileFullText,
} from "@/lib/resume/match";
import { claimableSkills } from "@/lib/resume/profile";
import { jdAnalysisSchema, MAX_JD_CHARS } from "@/lib/resume/schemas";
import {
  dedupeSkills,
  normalizeSkill,
  textMentionsSkill,
} from "@/lib/resume/skills";
import {
  RESUME_SECTIONS,
  SKILL_CATEGORY_LABELS,
  SKILL_CATEGORIES,
  type ImproveAction,
  type JDAnalysis,
  type ResumeContent,
  type ResumeExperience,
  type ResumeProfileData,
  type ResumeProject,
  type ResumeSkillGroup,
} from "@/types/resume";

const MODEL = "qwen/qwen3.8-27b";
const MAX_PROJECTS = 4;

// ─── Low-level JSON completion ────────────────────────────────────────────────

function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function completeJson<T>(params: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  temperature?: number;
}): Promise<{ data: T; tokens: number }> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.user },
        ],
        temperature: params.temperature ?? 0.3,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        stream: false,
      });
      const raw = completion.choices[0]?.message?.content ?? "";
      const parsed = params.schema.parse(extractJson(raw));
      return { data: parsed, tokens: completion.usage?.total_tokens ?? 0 };
    } catch (err) {
      lastError = err;
    }
  }
  console.error(
    "[resume.service] AI request failed:",
    lastError instanceof Error ? lastError.message : lastError,
  );
  throw new ResumeError(
    "AI_FAILED",
    "The AI couldn't complete this request. Please try again in a moment.",
    502,
  );
}

// ─── JD analysis ──────────────────────────────────────────────────────────────

const ANALYZE_SYSTEM = `You analyze job descriptions for a resume tool. Extract ONLY what the job description actually states. Never infer or invent requirements.
Return a single JSON object with exactly these keys:
{
  "jobTitle": string, "company": string, "experience": string (e.g. "2-4 years"), "employmentType": string, "location": string, "workMode": string ("Remote" | "Hybrid" | "On-site" | ""),
  "requiredSkills": string[], "preferredSkills": string[],
  "skillGroups": { "technical": string[], "languages": string[], "frameworks": string[], "databases": string[], "tools": string[], "cloud": string[], "soft": string[] },
  "responsibilities": string[] (max 10, short imperative phrases),
  "qualifications": { "education": string[], "experience": string[], "certifications": string[], "other": string[] },
  "keywords": [ { "term": string, "importance": "required" | "preferred" | "important" | "nice_to_have" } ]
}
Rules: use empty string / empty array when something is not stated. Use canonical names ("Node.js", "PostgreSQL"). Skills marked "must", "required", "mandatory" go in requiredSkills; "plus", "nice to have", "preferred", "bonus" go in preferredSkills. Keywords are ATS terms and short phrases (max 30), no duplicates. Output JSON only.`;

export async function analyzeJobDescription(
  jobDescription: string,
  hints: { jobTitle?: string; company?: string; location?: string } = {},
): Promise<{ analysis: Omit<JDAnalysis, "matchedSkills" | "missingSkills">; tokens: number }> {
  const hintLines = [
    hints.jobTitle && `Job title (provided by user): ${hints.jobTitle}`,
    hints.company && `Company (provided by user): ${hints.company}`,
    hints.location && `Location (provided by user): ${hints.location}`,
  ]
    .filter(Boolean)
    .join("\n");

  const { data, tokens } = await completeJson({
    system: ANALYZE_SYSTEM,
    user: `${hintLines ? hintLines + "\n\n" : ""}JOB DESCRIPTION:\n"""\n${jobDescription.slice(0, MAX_JD_CHARS)}\n"""`,
    schema: jdAnalysisSchema,
  });

  // User-provided fields win over AI inference
  const analysis = {
    ...data,
    jobTitle: hints.jobTitle?.trim() || data.jobTitle,
    company: hints.company?.trim() || data.company,
    location: hints.location?.trim() || data.location,
  };
  const { matchedSkills: _m, missingSkills: _x, ...rest } = analysis;
  void _m;
  void _x;
  return { analysis: rest, tokens };
}

/** Attaches matched/missing skills computed deterministically from the profile. */
export function withSkillGap(
  analysis: Omit<JDAnalysis, "matchedSkills" | "missingSkills"> | JDAnalysis,
  profile: ResumeProfileData,
): JDAnalysis {
  const gap = computeSkillGap(analysis as JDAnalysis, profile);
  return { ...(analysis as JDAnalysis), ...gap };
}

// ─── Resume generation ────────────────────────────────────────────────────────

const GENERATE_SYSTEM = `You are a resume writer. You tailor a candidate's EXISTING information to a target job. You are strictly forbidden from fabricating anything.

ABSOLUTE RULES
1. Use ONLY facts present in the candidate data. Never invent experience, skills, technologies, certifications, education, job titles, companies, achievements, metrics, projects or responsibilities.
2. Never add a number, percentage, team size, year count or metric unless it appears in the candidate data for that same item.
3. Never claim a technology just because the job description mentions it. The "unsupportedSkills" list contains JD skills the candidate does NOT have - never mention them anywhere.
4. Preserve factual meaning when rewriting. You may rephrase, reorder, and emphasise relevant technologies and responsibilities that are already stated.
5. Do not keyword-stuff or repeat the same keyword unnaturally. Write natural, specific sentences. No filler such as "results-driven", "passionate", "dynamic".
6. If information is missing, leave it out. Do not guess.
7. Bullets start with a strong past-tense verb (present tense for the current role), are one sentence, and are under 28 words.

OUTPUT: a single JSON object:
{
  "summary": string (2-3 sentences, role-specific, built from the candidate's real experience, skills and projects; no first-person pronouns),
  "experience": [ { "id": string (copy from input), "bullets": string[] (2-5 bullets, most JD-relevant first) } ],
  "projects": [ { "id": string (copy from input), "bullets": string[] (1-3 bullets) } ]
}
Include every experience and project id you were given. Output JSON only.`;

const generatedSchema = z.object({
  summary: z.string().default(""),
  experience: z
    .array(z.object({ id: z.string(), bullets: z.array(z.string()).default([]) }))
    .default([]),
  projects: z
    .array(z.object({ id: z.string(), bullets: z.array(z.string()).default([]) }))
    .default([]),
});

function splitSentences(text: string): string[] {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[\s•\-*]+/, "").trim())
    .filter((s) => s.length > 8);
}

function sourceBullets(parts: {
  achievements: string[];
  description: string;
  responsibilities?: string[];
}): string[] {
  const a = parts.achievements.map((s) => s.trim()).filter(Boolean);
  const r = (parts.responsibilities ?? []).map((s) => s.trim()).filter(Boolean);
  const fromDesc = splitSentences(parts.description);
  return [...a, ...r, ...fromDesc].slice(0, 5);
}

function experienceSource(e: ResumeProfileData["experience"][number]) {
  return [e.title, e.company, e.description, ...e.achievements, ...e.technologies].join("\n");
}

function projectSource(p: ResumeProfileData["projects"][number]) {
  return [
    p.name,
    p.description,
    ...p.responsibilities,
    ...p.achievements,
    ...p.technologies,
  ].join("\n");
}

function profileSourceText(profile: ResumeProfileData): string {
  return [
    profileFullText(profile),
    ...profile.experience.flatMap((e) => [e.startDate, e.endDate]),
    ...profile.education.flatMap((e) => [e.startDate, e.endDate, e.grade]),
  ].join("\n");
}

function relevanceScore(text: string, analysis: JDAnalysis): number {
  const { required, preferred } = jdTechnicalSkills(analysis);
  let score = 0;
  for (const s of required) if (textMentionsSkill(text, s)) score += 2;
  for (const s of preferred) if (textMentionsSkill(text, s)) score += 1;
  return score;
}

/** Orders profile skills so JD-relevant ones lead; never adds a skill. */
function buildSkillGroups(
  profile: ResumeProfileData,
  analysis: JDAnalysis,
): ResumeSkillGroup[] {
  const { required, preferred } = jdTechnicalSkills(analysis);
  const rank = new Map<string, number>();
  [...required, ...preferred].forEach((s, i) => {
    const key = normalizeSkill(s);
    if (!rank.has(key)) rank.set(key, i);
  });

  const groups = SKILL_CATEGORIES.map((cat) => {
    const items = dedupeSkills(profile.skills[cat]);
    const sorted = [...items].sort((a, b) => {
      const ra = rank.get(normalizeSkill(a)) ?? Infinity;
      const rb = rank.get(normalizeSkill(b)) ?? Infinity;
      return ra - rb;
    });
    const hits = items.filter((i) => rank.has(normalizeSkill(i))).length;
    return { cat, items: sorted, hits };
  }).filter((g) => g.items.length > 0);

  groups.sort((a, b) => b.hits - a.hits);
  return groups.map((g) => ({
    id: randomUUID(),
    category: SKILL_CATEGORY_LABELS[g.cat],
    items: g.items,
  }));
}

function fallbackSummary(profile: ResumeProfileData, analysis: JDAnalysis): string {
  if (profile.summary.trim()) return profile.summary.trim();
  const latest = profile.experience[0];
  const top = dedupeSkills(analysis.matchedSkills).slice(0, 5);
  const skills = top.length ? top : claimableSkills(profile).slice(0, 5);
  const role = latest?.title?.trim() || analysis.jobTitle || "Professional";
  return skills.length
    ? `${role} with hands-on experience in ${skills.join(", ")}.`
    : `${role}.`;
}

export async function generateTailoredResume(
  profile: ResumeProfileData,
  analysis: JDAnalysis,
): Promise<{ content: ResumeContent; tokens: number }> {
  const unsupported = analysis.missingSkills;

  // Deterministic project selection: skill/technology match first
  const rankedProjects = profile.projects
    .filter((p) => p.name.trim())
    .map((p, index) => ({ p, index, score: relevanceScore(projectSource(p), analysis) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, MAX_PROJECTS)
    .map((x) => x.p);

  const experiences = profile.experience.filter(
    (e) => e.company.trim() && e.title.trim(),
  );

  // Contact details are intentionally NOT sent to the AI provider.
  const aiInput = {
    target: {
      jobTitle: analysis.jobTitle,
      requiredSkills: analysis.requiredSkills,
      preferredSkills: analysis.preferredSkills,
      responsibilities: analysis.responsibilities,
      unsupportedSkills: unsupported,
    },
    candidate: {
      existingSummary: profile.summary,
      skills: claimableSkills(profile),
      experience: experiences.map((e) => ({
        id: e.id,
        title: e.title,
        company: e.company,
        description: e.description,
        achievements: e.achievements,
        technologies: e.technologies,
      })),
      projects: rankedProjects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        responsibilities: p.responsibilities,
        achievements: p.achievements,
      })),
    },
  };

  const { data, tokens } = await completeJson({
    system: GENERATE_SYSTEM,
    user: JSON.stringify(aiInput),
    schema: generatedSchema,
    temperature: 0.4,
  });

  const wholeSource = profileSourceText(profile);

  // Summary: validated against the whole profile
  const summaryCheck = checkGrounding({
    candidate: data.summary,
    source: wholeSource,
    unsupportedSkills: unsupported,
  });
  const summary =
    data.summary.trim() && summaryCheck.ok
      ? data.summary.trim()
      : fallbackSummary(profile, analysis);

  const validateBullets = (bullets: string[], source: string): string[] =>
    bullets
      .map((b) => b.replace(/^[\s•\-*]+/, "").trim())
      .filter((b) => b.length > 0 && b.length <= 320)
      .filter(
        (b) => checkGrounding({ candidate: b, source, unsupportedSkills: unsupported }).ok,
      );

  const experience: ResumeExperience[] = experiences.map((e) => {
    const ai = data.experience.find((x) => x.id === e.id);
    let bullets = validateBullets(ai?.bullets ?? [], experienceSource(e));
    if (bullets.length === 0) bullets = sourceBullets(e);
    return {
      id: e.id,
      company: e.company,
      title: e.title,
      employmentType: e.employmentType,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      bullets: bullets.slice(0, 5),
    };
  });

  const projects: ResumeProject[] = rankedProjects.map((p) => {
    const ai = data.projects.find((x) => x.id === p.id);
    let bullets = validateBullets(ai?.bullets ?? [], projectSource(p));
    if (bullets.length === 0) {
      bullets = sourceBullets({
        achievements: p.achievements,
        responsibilities: p.responsibilities,
        description: p.description,
      }).slice(0, 3);
    }
    return {
      id: p.id,
      name: p.name,
      technologies: p.technologies,
      url: p.url,
      githubUrl: p.githubUrl,
      bullets: bullets.slice(0, 3),
    };
  });

  const content: ResumeContent = {
    personal: profile.personal,
    summary,
    experience,
    projects,
    skills: buildSkillGroups(profile, analysis),
    education: profile.education.filter((e) => e.institution.trim() || e.degree.trim()),
    certifications: profile.certifications.filter((c) => c.name.trim()),
    achievements: profile.achievements.filter((a) => a.title.trim()),
    sectionOrder: [...RESUME_SECTIONS],
    hiddenSections: [],
  };

  return { content, tokens };
}

// ─── Section improvement ──────────────────────────────────────────────────────

const ACTION_INSTRUCTIONS: Record<ImproveAction, string> = {
  improve: "Improve clarity and wording while keeping the exact same facts.",
  concise: "Make it shorter and tighter. Remove filler. Keep every fact that matters.",
  ats: "Make it more ATS-friendly: plain wording, standard terminology, strong verb first. Use JD terminology only where the candidate genuinely has that skill.",
  technical: "Emphasise the technical work and technologies that are already stated.",
  leadership: "Emphasise ownership, collaboration or leadership - only if the original or source data supports it. Otherwise keep wording factual.",
  relevant: "Emphasise the parts most relevant to the target job, using only what is stated.",
  stronger: "Write a stronger, more specific version using a strong action verb. Do not add outcomes or metrics that are not stated.",
  "rewrite-summary": "Rewrite as a concise 2-3 sentence professional summary tailored to the target job, using only the candidate source data.",
};

const IMPROVE_SYSTEM = `You edit one piece of resume text. Never fabricate: no new skills, technologies, employers, titles, metrics, numbers, or achievements. Never mention any skill in "unsupportedSkills". Preserve factual meaning. Do not keyword-stuff. Return JSON: {"text": string}. The text must be a single bullet (no leading bullet character) unless the instruction is to rewrite a summary.`;

export async function improveText(params: {
  action: ImproveAction;
  text: string;
  source: string;
  analysis?: JDAnalysis;
  unsupportedSkills: string[];
}): Promise<{ text: string; tokens: number }> {
  const user = JSON.stringify({
    instruction: ACTION_INSTRUCTIONS[params.action],
    textToEdit: params.text,
    sourceFacts: params.source.slice(0, 6000),
    target: params.analysis
      ? {
          jobTitle: params.analysis.jobTitle,
          requiredSkills: params.analysis.requiredSkills,
        }
      : undefined,
    unsupportedSkills: params.unsupportedSkills,
  });

  const schema = z.object({ text: z.string().min(1) });
  const allowedSource = `${params.source}\n${params.text}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, tokens } = await completeJson({
      system: IMPROVE_SYSTEM,
      user,
      schema,
      temperature: 0.4,
    });
    const cleaned = data.text.replace(/^[\s•\-*]+/, "").trim();
    const check = checkGrounding({
      candidate: cleaned,
      source: allowedSource,
      unsupportedSkills: params.unsupportedSkills,
    });
    if (cleaned && check.ok) return { text: cleaned, tokens };
  }
  throw new ResumeError(
    "AI_FAILED",
    "We couldn't improve this without adding details that aren't in your profile. Try editing it manually.",
    422,
  );
}
