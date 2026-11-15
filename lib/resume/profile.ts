import { randomUUID } from "crypto";
import ConnectDB from "@/lib/db";
import userModel from "@/models/user";
import ResumeProfileModel from "@/models/ResumeProfile";
import { resumeProfileSchema } from "@/lib/resume/schemas";
import { categorizeSkill, dedupeSkills, flatSkills } from "@/lib/resume/skills";
import {
  SKILL_CATEGORIES,
  type ProfileSkills,
  type ResumeProfileData,
} from "@/types/resume";

export function emptySkills(): ProfileSkills {
  return Object.fromEntries(
    SKILL_CATEGORIES.map((k) => [k, [] as string[]]),
  ) as ProfileSkills;
}

export function emptyProfile(): ResumeProfileData {
  return {
    personal: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
      otherLinks: [],
    },
    summary: "",
    experience: [],
    education: [],
    skills: emptySkills(),
    projects: [],
    certifications: [],
    achievements: [],
  };
}

interface SessionUserLike {
  id: string;
  name?: string | null;
  email?: string | null;
}

/**
 * Loads the user's resume profile. When none has been saved yet, seeds one
 * from the existing account profile (name, contact, links, skills, education)
 * so users don't start from a blank form. Seeded data is NOT persisted until
 * the user saves it.
 */
export async function loadResumeProfile(
  user: SessionUserLike,
): Promise<{ profile: ResumeProfileData; seeded: boolean }> {
  await ConnectDB();

  const stored = await ResumeProfileModel.findOne({ userId: user.id }).lean();
  if (stored?.data) {
    const parsed = resumeProfileSchema.safeParse(stored.data);
    if (parsed.success) {
      return { profile: parsed.data as ResumeProfileData, seeded: false };
    }
  }

  const account = await userModel.findOne({ authUserId: user.id }).lean();
  const profile = emptyProfile();

  profile.personal.fullName = account?.fullName || user.name || "";
  profile.personal.email = user.email || "";
  profile.personal.phone = account?.phone || "";
  profile.personal.location = account?.currentLocation || "";
  profile.personal.linkedin = account?.socialLinks?.linkedin || "";
  profile.personal.github = account?.socialLinks?.github || "";
  profile.personal.portfolio = account?.socialLinks?.portfolio || "";

  for (const skill of dedupeSkills(account?.skills ?? [])) {
    profile.skills[categorizeSkill(skill)].push(skill);
  }

  if (account?.education?.degree || account?.education?.university) {
    profile.education.push({
      id: randomUUID(),
      institution: account.education.university || "",
      degree: account.education.degree || "",
      field: "",
      startDate: "",
      endDate: account.education.passingYear || "",
      grade: account.education.cgpa || "",
    });
  }

  if (account?.currentJobTitle && account?.currentCompany) {
    profile.experience.push({
      id: randomUUID(),
      company: account.currentCompany,
      title: account.currentJobTitle,
      employmentType: "",
      location: "",
      startDate: "",
      endDate: "",
      current: true,
      description: "",
      achievements: [],
      technologies: [],
    });
  }

  return { profile, seeded: true };
}

function hasExperienceDetail(profile: ResumeProfileData) {
  return profile.experience.some(
    (e) =>
      e.company.trim() &&
      e.title.trim() &&
      (e.description.trim() || e.achievements.some((a) => a.trim())),
  );
}

function hasProjectDetail(profile: ResumeProfileData) {
  return profile.projects.some(
    (p) =>
      p.name.trim() &&
      (p.description.trim() ||
        p.responsibilities.some((r) => r.trim()) ||
        p.achievements.some((a) => a.trim())),
  );
}

/**
 * Things the profile still needs before a tailored resume can be generated
 * honestly. A profile is sufficient with a name, skills, and experience OR
 * projects (each with real descriptive text).
 */
export function profileGaps(profile: ResumeProfileData): string[] {
  const gaps: string[] = [];
  if (!profile.personal.fullName.trim()) gaps.push("Your full name");
  if (flatSkills(profile.skills).length === 0) gaps.push("Skills");
  if (!hasExperienceDetail(profile) && !hasProjectDetail(profile)) {
    gaps.push("Work experience (with a description)");
    gaps.push("Projects (with a description)");
  }
  return gaps;
}

export function isProfileSufficient(profile: ResumeProfileData): boolean {
  return profileGaps(profile).length === 0;
}

/** All skills/technologies the user can legitimately claim. */
export function claimableSkills(profile: ResumeProfileData): string[] {
  return dedupeSkills([
    ...flatSkills(profile.skills),
    ...profile.experience.flatMap((e) => e.technologies),
    ...profile.projects.flatMap((p) => p.technologies),
  ]);
}
