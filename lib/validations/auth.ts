import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

const experienceValues = ["0-1", "1-3", "3-5", "5-10", "10+"] as const;

export const EXPERIENCE_OPTIONS = [
  { value: "0-1", label: "Less than 1 year" },
  { value: "1-3", label: "1 – 3 years" },
  { value: "3-5", label: "3 – 5 years" },
  { value: "5-10", label: "5 – 10 years" },
  { value: "10+", label: "10+ years" },
] as const;

export const RESUME_ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
] as const;

export const RESUME_ACCEPTED_EXTENSIONS = [".pdf", ".docx"] as const;

export function isSupportedResumeFile(file: File) {
  if (!file) {
    return false;
  }

  const fileName = file.name.toLowerCase();
  return (
    RESUME_ACCEPTED_MIME_TYPES.includes(file.type as (typeof RESUME_ACCEPTED_MIME_TYPES)[number]) ||
    RESUME_ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension))
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  rememberMe: z.boolean(),
  privacyPolicyAccepted: z
    .boolean()
    .refine((value) => value, "Please accept the Privacy Policy to continue."),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Register Step 1 ─────────────────────────────────────────────────────────
export const registerStep1Schema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^\+?[0-9\s\-().]{7,20}$/, "Please enter a valid phone number"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterStep1Data = z.infer<typeof registerStep1Schema>;

// ─── Register Step 2 ─────────────────────────────────────────────────────────
export const registerStep2Schema = z.object({
  currentJobTitle: z
    .string()
    .min(1, "Current job title is required")
    .min(2, "Current job title must be at least 2 characters"),
  yearsOfExperience: z.enum(experienceValues, {
    message: "Please select your years of experience",
  }),
  currentLocation: z
    .string()
    .min(1, "Current location is required")
    .min(2, "Current location must be at least 2 characters"),
  skills: z
    .array(z.string())
    .min(1, "Please add at least one skill"),
  resume: z.custom<File | undefined>(
    (value) => value === undefined || value instanceof File,
    "Please upload a resume file"
  ).refine((file) => file instanceof File && isSupportedResumeFile(file), {
    message: "Resume must be a PDF or DOCX file",
  }),
});

export type RegisterStep2Data = z.infer<typeof registerStep2Schema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^\+?[0-9\s\-().]{7,20}$/, "Please enter a valid phone number"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    currentJobTitle: z
      .string()
      .min(1, "Current job title is required")
      .min(2, "Current job title must be at least 2 characters"),
    yearsOfExperience: z.enum(experienceValues, {
      message: "Please select your years of experience",
    }),
    currentLocation: z
      .string()
      .min(1, "Current location is required")
      .min(2, "Current location must be at least 2 characters"),
    skills: z
      .array(z.string())
      .min(1, "Please add at least one skill"),
    resume: z.custom<File | undefined>(
      (value) => value === undefined || value instanceof File,
      "Please upload a resume file"
    ).refine((file) => file instanceof File && isSupportedResumeFile(file), {
      message: "Resume must be a PDF or DOCX file",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Password Strength Utility ────────────────────────────────────────────────
export interface PasswordStrength {
  score: number; // 0–4
  label: string;
  color: string;
  bgColor: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "", color: "", bgColor: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map: Record<number, Omit<PasswordStrength, "score">> = {
    0: { label: "", color: "text-gray-400", bgColor: "bg-gray-200" },
    1: { label: "Weak", color: "text-red-500", bgColor: "bg-red-500" },
    2: { label: "Fair", color: "text-orange-500", bgColor: "bg-orange-400" },
    3: { label: "Good", color: "text-yellow-600", bgColor: "bg-yellow-400" },
    4: { label: "Strong", color: "text-green-600", bgColor: "bg-green-500" },
  };

  return { score, ...map[score] };
}
