import { textMentionsSkill } from "@/lib/resume/skills";

/**
 * Anti-fabrication checks applied to every piece of AI-written text.
 *
 * The model is instructed not to invent anything, but we never rely on that:
 * rewritten text is rejected if it introduces numbers that aren't in the
 * user's own source text, claims a JD skill the user doesn't have, or adds
 * leadership/ownership claims or named entities the source never mentions.
 * These are heuristics, not proof: on rejection callers fall back to the source.
 */

const NUMBER_RE = /\d+(?:[.,]\d+)*/g;

function numbersIn(text: string): string[] {
  return (text.match(NUMBER_RE) ?? []).map((n) => n.replace(/,/g, ""));
}

/** Numbers (metrics, years, counts) present in `candidate` but not in `source`. */
export function ungroundedNumbers(candidate: string, source: string): string[] {
  const allowed = new Set(numbersIn(source));
  return numbersIn(candidate).filter((n) => !allowed.has(n));
}

/** JD skills the user lacks that the candidate text nevertheless mentions. */
export function unsupportedSkillClaims(
  candidate: string,
  unsupportedSkills: string[],
  source: string,
): string[] {
  return unsupportedSkills.filter(
    (skill) =>
      textMentionsSkill(candidate, skill) && !textMentionsSkill(source, skill),
  );
}

/**
 * High-risk claim words (leadership, ownership, seniority, awards). If the
 * candidate uses one that the source never does, treat it as an invented claim.
 * Matched by stem so "led/leading/lead", "managed/managing" etc. are covered.
 */
const CLAIM_STEMS = [
  "led", "lead", "leader", "leadership", "manag", "mentor", "supervis", "direct",
  "head", "headed", "founded", "cofound", "spearhead", "own", "owned", "owner",
  "architect", "principal", "senior", "staff", "award", "patent", "publish",
  "certified", "promot", "launch", "pioneer", "champion", "oversaw", "oversee",
  "train", "hire", "hired", "recruit",
];

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z][a-z'-]*/g) ?? [];
}

function hasStem(ws: string[], stem: string): boolean {
  // Short stems must match whole words; longer ones match as prefixes.
  return stem.length <= 4
    ? ws.some((w) => w === stem)
    : ws.some((w) => w.startsWith(stem));
}

/** Claim words present in `candidate` but absent from `source`. */
export function unsupportedClaimWords(candidate: string, source: string): string[] {
  const c = words(candidate);
  const s = words(source);
  return CLAIM_STEMS.filter((stem) => hasStem(c, stem) && !hasStem(s, stem));
}

/**
 * Capitalised terms (companies, tools, products) appearing mid-sentence in the
 * candidate that the source never mentions.
 */
export function unsupportedProperNouns(candidate: string, source: string): string[] {
  const src = source.toLowerCase();
  const found = new Set<string>();
  const tokens = candidate.split(/\s+/);
  tokens.forEach((tok, i) => {
    const prev = tokens[i - 1] ?? "";
    if (i === 0 || /[.!?:;•\-–]$/.test(prev)) return; // sentence/bullet start
    const clean = tok.replace(/^[^A-Za-z]+|[^A-Za-z0-9+#.]+$/g, "");
    if (clean.length < 2 || !/^[A-Z]/.test(clean)) return;
    if (!src.includes(clean.toLowerCase())) found.add(clean);
  });
  return [...found];
}

export interface GroundingResult {
  ok: boolean;
  reason?: string;
}

export function checkGrounding(params: {
  candidate: string;
  source: string;
  unsupportedSkills: string[];
}): GroundingResult {
  const nums = ungroundedNumbers(params.candidate, params.source);
  if (nums.length) {
    return { ok: false, reason: `introduces unsupported numbers: ${nums.join(", ")}` };
  }
  const skills = unsupportedSkillClaims(
    params.candidate,
    params.unsupportedSkills,
    params.source,
  );
  if (skills.length) {
    return { ok: false, reason: `claims skills not in the profile: ${skills.join(", ")}` };
  }
  const claims = unsupportedClaimWords(params.candidate, params.source);
  if (claims.length) {
    return { ok: false, reason: `introduces unsupported claims: ${claims.join(", ")}` };
  }
  const nouns = unsupportedProperNouns(params.candidate, params.source);
  if (nouns.length) {
    return { ok: false, reason: `introduces unsupported names/terms: ${nouns.join(", ")}` };
  }
  return { ok: true };
}
