/**
 * profileCompletion.ts
 *
 * Pure utility that computes profile completion status from a profile document.
 * Adding / removing required fields only requires updating REQUIRED_FIELDS here
 * — the frontend and API endpoint pick up the changes automatically.
 */

export interface ProfileCompletionResult {
  profileCompleted: boolean;
  completionPercentage: number;
  missingFields: string[];
}

interface FieldSpec {
  /** Human-readable label returned to the client */
  label: string;
  /** Returns true when the field is considered "filled in" */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  check: (profile: Record<string, any>) => boolean;
}

const REQUIRED_FIELDS: FieldSpec[] = [
  {
    label: "Full Name",
    check: (p) => Boolean(p.fullName?.trim()),
  },
  {
    label: "Phone Number",
    check: (p) => Boolean(p.phone?.trim()),
  },
  {
    label: "Location",
    check: (p) => Boolean(p.currentLocation?.trim()),
  },
  {
    label: "Resume",
    check: (p) => Boolean(p.resume?.trim()),
  },
  {
    label: "Skills",
    check: (p) => Array.isArray(p.skills) && p.skills.length > 0,
  },
  {
    label: "Experience",
    check: (p) => Boolean(p.yearsOfExperience?.trim()),
  },
  {
    label: "Education",
    check: (p) => Boolean(p.education?.degree?.trim()),
  },
  {
    label: "Preferred Job Role",
    check: (p) => Boolean(p.currentJobTitle?.trim()),
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeProfileCompletion(
  profile: Record<string, any>,
): ProfileCompletionResult {
  const missingFields: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!field.check(profile)) {
      missingFields.push(field.label);
    }
  }

  const filledCount = REQUIRED_FIELDS.length - missingFields.length;
  const completionPercentage = Math.round(
    (filledCount / REQUIRED_FIELDS.length) * 100,
  );
  const profileCompleted = missingFields.length === 0;

  return { profileCompleted, completionPercentage, missingFields };
}
