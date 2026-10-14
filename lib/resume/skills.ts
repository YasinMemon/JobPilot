import type { ProfileSkills, SkillCategoryKey } from "@/types/resume";

/**
 * Skill normalisation + matching helpers. Used for deterministic checks
 * (grounding, missing-skill detection, match score) so none of those results
 * depend on the AI's own claims.
 */

const ALIASES: Record<string, string> = {
  js: "javascript",
  ecmascript: "javascript",
  ts: "typescript",
  reactjs: "react",
  nextjs: "next",
  nodejs: "node",
  expressjs: "express",
  vuejs: "vue",
  angularjs: "angular",
  nestjs: "nest",
  mongo: "mongodb",
  postgres: "postgresql",
  psql: "postgresql",
  k8s: "kubernetes",
  gcp: "googlecloud",
  googlecloudplatform: "googlecloud",
  amazonwebservices: "aws",
  restapi: "rest",
  restapis: "rest",
  restful: "rest",
  restfulapi: "rest",
  restfulapis: "rest",
  tailwindcss: "tailwind",
  golang: "go",
};

/** "Node.js" → "node", "React.js" → "react", "REST APIs" → "rest". */
export function normalizeSkill(raw: string): string {
  let t = raw.toLowerCase().trim();
  // keep c++ / c# distinguishable from "c" before stripping punctuation
  t = t.replace(/c\+\+/g, "cpp").replace(/c#/g, "csharp");
  t = t.replace(/[^a-z0-9]+/g, "");
  return ALIASES[t] ?? t;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Does `text` mention `skill` (alias-aware, whole-word)? */
export function textMentionsSkill(text: string, skill: string): boolean {
  const target = normalizeSkill(skill);
  if (!target) return false;
  const lower = text.toLowerCase();

  // Whole-word match on the raw skill (handles multi-word skills)
  const raw = skill.toLowerCase().trim();
  if (raw) {
    const re = new RegExp(
      `(^|[^a-z0-9+#])${escapeRegex(raw)}([^a-z0-9+#]|$)`,
      "i",
    );
    if (re.test(lower)) return true;
  }

  // Token-level match through normalisation (node.js ~ nodejs ~ node)
  const tokens = lower.split(/[\s,/()|;:]+/).filter(Boolean);
  for (const tok of tokens) {
    if (normalizeSkill(tok) === target) return true;
  }
  // Adjacent two-token windows ("rest api", "google cloud")
  for (let i = 0; i < tokens.length - 1; i++) {
    if (normalizeSkill(`${tokens[i]}${tokens[i + 1]}`) === target) return true;
  }
  return false;
}

export function dedupeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of skills) {
    const clean = s.trim();
    const key = normalizeSkill(clean);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out;
}

export function toSkillSet(skills: string[]): Set<string> {
  return new Set(skills.map(normalizeSkill).filter(Boolean));
}

// ─── Categorisation (only used to seed a profile from a flat skill list) ─────

const CATEGORY_HINTS: Record<Exclude<SkillCategoryKey, "other">, string[]> = {
  programmingLanguages: [
    "javascript", "typescript", "python", "java", "go", "rust", "csharp", "cpp",
    "c", "php", "ruby", "kotlin", "swift", "scala", "sql", "dart", "r",
  ],
  frontend: [
    "html", "css", "sass", "scss", "tailwind", "bootstrap", "redux", "antd",
    "materialui", "mui", "shadcn", "webpack", "vite", "jquery",
  ],
  frameworks: [
    "react", "next", "vue", "angular", "svelte", "node", "express", "nest",
    "django", "flask", "fastapi", "spring", "laravel", "rails", "dotnet",
    "reactnative", "flutter",
  ],
  backend: ["graphql", "rest", "grpc", "microservices", "websockets", "jwt", "oauth"],
  databases: [
    "mongodb", "postgresql", "mysql", "sqlite", "redis", "dynamodb",
    "firebase", "elasticsearch", "cassandra", "mariadb", "oracle", "mongoose",
    "prisma",
  ],
  cloudDevOps: [
    "aws", "azure", "googlecloud", "docker", "kubernetes", "terraform",
    "jenkins", "cicd", "githubactions", "nginx", "linux", "vercel", "netlify",
    "cloudinary", "heroku",
  ],
  tools: [
    "git", "github", "gitlab", "jira", "postman", "figma", "npm", "yarn",
    "jest", "cypress", "vscode", "swagger", "slack", "notion",
  ],
};

export function categorizeSkill(skill: string): SkillCategoryKey {
  const key = normalizeSkill(skill);
  for (const [cat, hints] of Object.entries(CATEGORY_HINTS)) {
    if (hints.includes(key)) return cat as SkillCategoryKey;
  }
  return "other";
}

export function flatSkills(skills: ProfileSkills): string[] {
  return dedupeSkills(Object.values(skills).flat());
}
