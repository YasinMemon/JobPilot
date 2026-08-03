"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import AuthCard from "../AuthCard";
import Input from "../Input";
import LoadingButton from "../LoadingButton";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";

const demoSubmitDelay = 800;

export default function ForgotPasswordForm() {
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, demoSubmitDelay));
    setIsSent(true);
  });

  return (
    <AuthCard
      badge="Password recovery"
      title={isSent ? "Password reset link sent" : "Forgot your password?"}
      subtitle={
        isSent
          ? "We sent a reset link if the email exists in our system."
          : "Enter your email address and we’ll send you a link to reset your password."
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
        {isSent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <MailCheck className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">Password reset link has been sent.</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    Check your inbox for a secure link to finish resetting your password.
                  </p>
                </div>
              </div>
            </div>

            <Button type="button" size="lg" className="w-full" variant="outline" onClick={() => setIsSent(false)}>
              Send another link
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
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              leftIcon={<Mail className="size-4" />}
              error={errors.email?.message}
              {...register("email")}
              required
            />

            <LoadingButton type="submit" loading={isSubmitting} loadingLabel="Sending link...">
              Send Reset Link
            </LoadingButton>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}