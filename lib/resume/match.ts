import { claimableSkills } from "@/lib/resume/profile";
import {
  dedupeSkills,
  normalizeSkill,
  textMentionsSkill,
  toSkillSet,
} from "@/lib/resume/skills";
import type {
  JDAnalysis,
  MatchBreakdown,
  ResumeContent,
  ResumeProfileData,
} from "@/types/resume";

/**
 * Deterministic Resume–JD match scoring.
 *
 * This is NOT an ATS score from any vendor — it is an internal heuristic
 * computed from plain text overlap between the JD analysis and the resume.
 * Nothing here relies on the AI's opinion of its own output.
 */

const WEIGHTS = {
  skills: 0.35,
  keywords: 0.25,
  experience: 0.2,
  projects: 0.1,
  education: 0.1,
} as const;

const KEYWORD_WEIGHT = {
  required: 3,
  important: 2,
  preferred: 2,
  nice_to_have: 1,
} as const;

const STOPWORDS = new Set(
  (
    "the and for with that this from will have your you our are able into " +
    "such other their them they who work working experience using use used " +
    "ability strong good team teams across within including plus year years"
  ).split(" "),
);

const pct = (n: number) => Math.max(0, Math.min(100, Math.round(n * 100)));

// ─── Text helpers ─────────────────────────────────────────────────────────────

function experienceText(content: ResumeContent): string {
  return content.experience
    .map((e) => [e.title, e.company, ...e.bullets].join(" "))
    .join("\n");
}

function projectsText(content: ResumeContent): string {
  return content.projects
    .map((p) => [p.name, p.technologies.join(" "), ...p.bullets].join(" "))
    .join("\n");
}

export function resumeFullText(content: ResumeContent): string {
  return [
    content.summary,
    experienceText(content),
    projectsText(content),
    content.skills.map((g) => g.items.join(" ")).join(" "),
    content.education.map((e) => `${e.degree} ${e.field} ${e.institution}`).join(" "),
    content.certifications.map((c) => c.name).join(" "),
    content.achievements.map((a) => `${a.title} ${a.description}`).join(" "),
  ].join("\n");
}

/** Everything the user has written about their work — the grounding source. */
export function profileFullText(profile: ResumeProfileData): string {
  return [
    profile.summary,
    ...profile.experience.flatMap((e) => [
      e.title,
      e.description,
      ...e.achievements,
      ...e.technologies,
    ]),
    ...profile.projects.flatMap((p) => [
      p.name,
      p.description,
      ...p.responsibilities,
      ...p.achievements,
      ...p.technologies,
    ]),
  ].join("\n");
}

// ─── JD skill lists ───────────────────────────────────────────────────────────

/** Technical (non-soft) skills the JD asks for, split by requirement level. */
export function jdTechnicalSkills(analysis: JDAnalysis) {
  const soft = toSkillSet(analysis.skillGroups.soft);
  const notSoft = (s: string) => !soft.has(normalizeSkill(s));

  const grouped = [
    ...analysis.skillGroups.technical,
    ...analysis.skillGroups.languages,
    ...analysis.skillGroups.frameworks,
    ...analysis.skillGroups.databases,
    ...analysis.skillGroups.tools,
    ...analysis.skillGroups.cloud,
  ];

  const required = dedupeSkills(analysis.requiredSkills).filter(notSoft);
  const requiredKeys = toSkillSet(required);
  const preferred = dedupeSkills(analysis.preferredSkills)
    .filter(notSoft)
    .filter((s) => !requiredKeys.has(normalizeSkill(s)));
  const known = toSkillSet([...required, ...preferred]);
  // Grouped skills the AI didn't classify as required/preferred count as required
  const extra = dedupeSkills(grouped)
    .filter(notSoft)
    .filter((s) => !known.has(normalizeSkill(s)));

  return { required: [...required, ...extra], preferred };
}

/**
 * Splits JD skills into matched / missing relative to the user's profile.
 * A skill counts as present if it is in the profile skill lists, listed as a
 * technology on a role/project, or explicitly mentioned in the user's own
 * experience/project text.
 */
export function computeSkillGap(
  analysis: JDAnalysis,
  profile: ResumeProfileData,
): { matchedSkills: string[]; missingSkills: string[] } {
  const { required, preferred } = jdTechnicalSkills(analysis);
  const claimable = toSkillSet(claimableSkills(profile));
  const text = profileFullText(profile);

  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of dedupeSkills([...required, ...preferred])) {
    if (claimable.has(normalizeSkill(skill)) || textMentionsSkill(text, skill)) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }
  return { matchedSkills: matched, missingSkills: missing };
}

// ─── Education level detection ────────────────────────────────────────────────

function educationLevel(text: string): number {
  const t = text.toLowerCase();
  if (/\b(ph\.?d|doctorate|doctoral)\b/.test(t)) return 5;
  if (/\b(master|m\.?tech|m\.?sc|m\.?e\b|mca|mba|m\.?s\b)/.test(t)) return 4;
  if (/\b(bachelor|b\.?tech|b\.?e\b|b\.?sc|bca|b\.?a\b|b\.?com|undergraduate|degree)/.test(t))
    return 3;
  if (/\b(diploma|associate)\b/.test(t)) return 2;
  return 0;
}

// ─── Main scoring ─────────────────────────────────────────────────────────────

export function computeMatch(
  content: ResumeContent,
  analysis: JDAnalysis,
): MatchBreakdown {
  const text = resumeFullText(content);
  const expText = experienceText(content);
  const projText = projectsText(content);
  const { required, preferred } = jdTechnicalSkills(analysis);
  const resumeSkillSet = toSkillSet(content.skills.flatMap((g) => g.items));

  const inResume = (skill: string) =>
    resumeSkillSet.has(normalizeSkill(skill)) || textMentionsSkill(text, skill);

  // Skills — required counts double
  let skillsNum = 0;
  let skillsDen = 0;
  for (const s of required) {
    skillsDen += 2;
    if (inResume(s)) skillsNum += 2;
  }
  for (const s of preferred) {
    skillsDen += 1;
    if (inResume(s)) skillsNum += 1;
  }
  const skills = skillsDen ? pct(skillsNum / skillsDen) : 0;

  // Keywords — weighted by importance
  let kwNum = 0;
  let kwDen = 0;
  for (const k of analysis.keywords) {
    const w = KEYWORD_WEIGHT[k.importance];
    kwDen += w;
    if (textMentionsSkill(text, k.term)) kwNum += w;
  }
  const keywords = kwDen ? pct(kwNum / kwDen) : 0;

  // Experience — skill evidence inside roles + responsibility overlap
  const allTech = dedupeSkills([...required, ...preferred]);
  const techInExp = allTech.length
    ? allTech.filter((s) => textMentionsSkill(expText, s)).length / allTech.length
    : 0;
  const expWords = new Set(
    expText
      .toLowerCase()
      .split(/[^a-z0-9+#]+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
  );
  let respHits = 0;
  for (const r of analysis.responsibilities) {
    const words = r
      .toLowerCase()
      .split(/[^a-z0-9+#]+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));
    if (!words.length) continue;
    const overlap = words.filter((w) => expWords.has(w)).length / words.length;
    if (overlap >= 0.3) respHits++;
  }
  const respCoverage = analysis.responsibilities.length
    ? respHits / analysis.responsibilities.length
    : techInExp;
  const experience = content.experience.length
    ? pct(0.6 * techInExp + 0.4 * respCoverage)
    : 0;

  // Projects — projects need not cover everything, so full marks at half coverage
  const techInProj = allTech.filter((s) => textMentionsSkill(projText, s)).length;
  const projects = content.projects.length
    ? pct(
        allTech.length
          ? Math.min(1, techInProj / Math.max(1, Math.ceil(allTech.length * 0.5)))
          : 0,
      )
    : 0;

  // Education — 100 when the JD doesn't ask for anything specific
  const requiredLevel = Math.max(
    0,
    ...analysis.qualifications.education.map(educationLevel),
  );
  let education = 100;
  if (requiredLevel > 0) {
    const have = Math.max(
      0,
      ...content.education.map((e) => educationLevel(`${e.degree} ${e.field}`)),
    );
    if (have >= requiredLevel) education = 100;
    else if (content.education.length > 0) education = have > 0 ? 50 : 40;
    else education = 0;
  }

  const overall = Math.round(
    skills * WEIGHTS.skills +
      keywords * WEIGHTS.keywords +
      experience * WEIGHTS.experience +
      projects * WEIGHTS.projects +
      education * WEIGHTS.education,
  );

  return { overall, skills, keywords, experience, projects, education };
}
