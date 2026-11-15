import { flatSkills } from "@/lib/resume/skills";
import type { ResumeProfileData } from "@/types/resume";

export const flatSkillCount = (profile: ResumeProfileData) =>
  flatSkills(profile.skills).length;

const compactList = (list: string[]) => list.map((s) => s.trim()).filter(Boolean);

/** Removes blank list entries before the profile is persisted. */
export function cleanProfile(profile: ResumeProfileData): ResumeProfileData {
  return {
    ...profile,
    experience: profile.experience.map((e) => ({
      ...e,
      achievements: compactList(e.achievements),
      technologies: compactList(e.technologies),
    })),
    projects: profile.projects.map((p) => ({
      ...p,
      technologies: compactList(p.technologies),
      responsibilities: compactList(p.responsibilities),
      achievements: compactList(p.achievements),
    })),
    personal: {
      ...profile.personal,
      otherLinks: profile.personal.otherLinks.filter((l) => l.url.trim()),
    },
  };
}

/** Removes blank bullets / empty items before saving a resume. */
export function cleanContent<T extends { experience: { bullets: string[] }[]; projects: { bullets: string[] }[] }>(
  content: T,
): T {
  return {
    ...content,
    experience: content.experience.map((e) => ({ ...e, bullets: compactList(e.bullets) })),
    projects: content.projects.map((p) => ({ ...p, bullets: compactList(p.bullets) })),
  };
}
