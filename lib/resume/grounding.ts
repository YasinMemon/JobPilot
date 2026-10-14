import { textMentionsSkill } from "@/lib/resume/skills";

/**
 * Anti-fabrication checks applied to every piece of AI-written text.
 *
 * The model is instructed not to invent anything, but we never rely on that:
 * rewritten text is rejected if it introduces numbers that aren't in the
 * user's own source text, or claims a JD skill the user doesn't have.
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
  return { ok: true };
}
