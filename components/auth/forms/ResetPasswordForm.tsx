"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import AuthCard from "../AuthCard";
import PasswordInput from "../PasswordInput";
import LoadingButton from "../LoadingButton";
import { Button } from "@/components/ui/button";
import { getPasswordStrength, resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/auth";

const demoSubmitDelay = 900;

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-300">Password strength</span>
        <span className={`text-xs font-semibold ${strength.color}`}>{strength.label}</span>
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

export default function ResetPasswordForm() {
  const [isComplete, setIsComplete] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, demoSubmitDelay));
    setIsComplete(true);
  });

  return (
    <AuthCard
      badge="New password"
      title={isComplete ? "Password updated" : "Reset password"}
      subtitle={
        isComplete
          ? "Your password has been updated successfully."
          : "Choose a strong new password for your JobPilot account."
      }
      footer={
        <p className="text-center text-sm text-slate-400">
          <Link href="/login" className="font-semibold text-indigo-300 transition hover:text-indigo-200">
            Back to login
          </Link>
        </p>
      }
    >
      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">You can now sign in with your new password.</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    Return to the login page to continue managing your applications.
                  </p>
                </div>
              </div>
            </div>

            <Button asChild size="lg" className="w-full">
              <Link href="/login">
                <KeyRound className="mr-2 size-4" />
                Go to Login
              </Link>
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
            onSubmit={onSubmit}
            noValidate
          >
            <PasswordInput
              label="New Password"
              autoComplete="new-password"
              placeholder="Enter a new password"
              error={errors.password?.message}
              {...register("password")}
              required
            />

            <PasswordStrengthMeter password={password} />

            <PasswordInput
              label="Confirm Password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
              required
            />

            <LoadingButton type="submit" loading={isSubmitting} loadingLabel="Resetting password...">
              Reset Password
            </LoadingButton>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}