"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import AuthCard from "../AuthCard";
import Input from "../Input";
import PasswordInput from "../PasswordInput";
import StepIndicator from "../StepIndicator";
import SkillsTagInput from "../SkillsTagInput";
import UploadResume from "../UploadResume";
import LoadingButton from "../LoadingButton";
import {
  EXPERIENCE_OPTIONS,
  getPasswordStrength,
  registerSchema,
  type RegisterFormData,
} from "@/lib/validations/auth";
import { usePost } from "@/app/hooks/useApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerResponse } from "@/types/auth/register";
import { authClient } from "@/lib/auth-client";

const stepFields = [
  ["fullName", "email", "phone", "password", "confirmPassword"] as const,
  [
    "currentJobTitle",
    "yearsOfExperience",
    "currentLocation",
    "skills",
    "resume",
  ] as const,
] as const;

const steps = [
  {
    key: "account",
    label: "Account details",
    description: "Your contact and security information.",
  },
  {
    key: "profile",
    label: "Career profile",
    description: "Your experience, skills, and resume.",
  },
] as const;

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) {
    return (
      <p className="text-xs text-slate-400">
        Use at least 8 characters with an uppercase letter, a number, and a
        symbol.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-300">
          Password strength
        </span>
        <span className={`text-xs font-semibold ${strength.color}`}>
          {strength.label}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition ${index < strength.score ? strength.bgColor : "bg-slate-200"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function RegisterForm() {
  const { postData } = usePost<registerResponse, FormData>("/profile/setup");

  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      currentJobTitle: "",
      yearsOfExperience: undefined,
      currentLocation: "",
      skills: [],
      resume: undefined,
    },
  });

  const password = useWatch({ control, name: "password" });
  const selectedSkills = useWatch({ control, name: "skills" });
  const selectedResume = useWatch({ control, name: "resume" });

  const nextStep = async () => {
    const fields = stepFields[currentStep];
    const isValid = await trigger(
      fields as unknown as (keyof RegisterFormData)[],
    );
    if (isValid) {
      setCurrentStep(1);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const isValid = await trigger();
    if (!isValid) {
      return;
    }

    const formData = new FormData();
    formData.append("fullName", values.fullName);
    formData.append("email", values.email);
    formData.append("phone", values.phone);
    formData.append("password", values.password);
    formData.append("currentJobTitle", values.currentJobTitle);
    formData.append("yearsOfExperience", String(values.yearsOfExperience));
    formData.append("currentLocation", values.currentLocation);
    if (values.skills) {
      values.skills.forEach((skill) => formData.append("skills", skill));
    }
    if (values.resume) {
      formData.append("resume", values.resume);
    }

    try {
      const result = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.fullName,
      });

      // Handle successful registration (e.g., redirect to login page)
      if (result.data?.user) {
        const profileForm = new FormData();

        profileForm.append("fullName", values.fullName);
        profileForm.append("currentJobTitle", values.currentJobTitle);
        profileForm.append("yearsOfExperience", values.yearsOfExperience);
        profileForm.append("currentLocation", values.currentLocation);

        values.skills.forEach((skill) => profileForm.append("skills", skill));

        if (values.resume) {
          profileForm.append("resume", values.resume);
        }

        await postData(profileForm, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        toast.success(
          "Account created successfully! Please check your email to verify your account.",
        );
        router.push("/login");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred during registration. Please try again.",
      );
    }
  });

  return (
    <AuthCard
      badge="Create account"
      title="Create your JobPilot account"
      subtitle="Start applying smarter with AI."
      footer={
        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-300 transition hover:text-indigo-200"
          >
            Sign In
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <StepIndicator
          steps={
            steps as unknown as typeof steps extends readonly (infer T)[]
              ? T[]
              : never
          }
          currentStep={currentStep}
        />

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          {currentStep === 0 ? (
            <div className="space-y-5">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                autoComplete="name"
                leftIcon={<UserRound className="size-4" />}
                error={errors.fullName?.message}
                {...register("fullName")}
                required
              />

              <Input
                label="Email"
                placeholder="jane@company.com"
                autoComplete="email"
                leftIcon={<Mail className="size-4" />}
                error={errors.email?.message}
                {...register("email")}
                required
              />

              <Input
                label="Phone Number"
                placeholder="+1 555 123 4567"
                autoComplete="tel"
                leftIcon={<Phone className="size-4" />}
                error={errors.phone?.message}
                {...register("phone")}
                required
              />

              <PasswordInput
                label="Password"
                autoComplete="new-password"
                placeholder="Create a password"
                error={errors.password?.message}
                {...register("password")}
                required
              />

              <PasswordStrengthMeter password={password} />

              <PasswordInput
                label="Confirm Password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
                required
              />

              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={nextStep}
              >
                Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <Input
                label="Current Job Title"
                placeholder="Product Designer"
                leftIcon={<BriefcaseBusiness className="size-4" />}
                error={errors.currentJobTitle?.message}
                {...register("currentJobTitle")}
                required
              />

              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="yearsOfExperience"
                >
                  Years of Experience{" "}
                  <span aria-hidden="true" className="text-indigo-300">
                    *
                  </span>
                </label>
                <select
                  id="yearsOfExperience"
                  className={`flex h-11 w-full rounded-xl border bg-white/5 px-3.5 text-sm text-white shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 ${
                    errors.yearsOfExperience
                      ? "border-rose-400"
                      : "border-white/10"
                  }`}
                  {...register("yearsOfExperience")}
                >
                  <option value="">Select your experience</option>
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.yearsOfExperience ? (
                  <p className="text-xs font-medium text-rose-400">
                    {errors.yearsOfExperience.message}
                  </p>
                ) : null}
              </div>

              <Input
                label="Current Location"
                placeholder="San Francisco, CA"
                leftIcon={<MapPin className="size-4" />}
                error={errors.currentLocation?.message}
                {...register("currentLocation")}
                required
              />

              <SkillsTagInput
                value={selectedSkills ?? []}
                onChange={(skills) =>
                  setValue("skills", skills, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={errors.skills?.message}
                helperText="Add the technologies and skills recruiters should see first."
              />

              <UploadResume
                value={selectedResume}
                onChange={(file) =>
                  setValue("resume", file ?? undefined, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={errors.resume?.message}
              />

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full sm:flex-1"
                  onClick={() => setCurrentStep(0)}
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Previous
                </Button>

                <LoadingButton
                  type="submit"
                  loading={isSubmitting}
                  loadingLabel="Creating account..."
                  className="sm:flex-1"
                >
                  Create Account
                </LoadingButton>
              </div>
            </div>
          )}
        </form>
      </div>
    </AuthCard>
  );
}
