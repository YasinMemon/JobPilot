"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Mail, MessageSquareText, Send } from "lucide-react";
import Input from "@/components/auth/Input";
import LoadingButton from "@/components/auth/LoadingButton";
import { CONTACT_CATEGORIES, CONTACT_SUPPORT_EMAIL } from "@/lib/public-content";
import { contactFormSchema, type ContactFormData } from "@/lib/validations/contact";

type SubmissionState = "idle" | "success" | "error";

const DEFAULT_VALUES: ContactFormData = {
  fullName: "",
  email: "",
  subject: "",
  category: CONTACT_CATEGORIES[0],
  message: "",
};

export default function ContactForm() {
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [submissionMessage, setSubmissionMessage] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmissionState("idle");
    setSubmissionMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "We could not send your message right now.");
      }

      reset(DEFAULT_VALUES);
      setSubmissionState("success");
      setSubmissionMessage(
        payload.message || "Thanks for reaching out. We will get back to you soon.",
      );
    } catch (error) {
      setSubmissionState("error");
      setSubmissionMessage(
        error instanceof Error
          ? error.message
          : "We could not send your message right now. Please try again.",
      );
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      {submissionState !== "idle" ? (
        <div
          role={submissionState === "error" ? "alert" : "status"}
          aria-live="polite"
          className={
            submissionState === "success"
              ? "flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100"
              : "flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100"
          }
        >
          {submissionState === "success" ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
          )}
          <p>{submissionMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Alex Johnson"
          leftIcon={<MessageSquareText className="size-4" />}
          error={errors.fullName?.message}
          {...register("fullName")}
          required
        />

        <Input
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="size-4" />}
          error={errors.email?.message}
          {...register("email")}
          required
        />
      </div>

      <Input
        label="Subject"
        type="text"
        autoComplete="off"
        placeholder="How can we help?"
        error={errors.subject?.message}
        {...register("subject")}
        required
      />

      <div className="space-y-1.5">
        <label htmlFor="category" className="flex items-center gap-1 text-sm font-medium text-slate-200">
          Category <span aria-hidden="true" className="text-indigo-300">*</span>
        </label>
        <div className="relative">
          <select
            id="category"
            className="flex h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3.5 pr-10 text-sm text-white shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? "category-error" : undefined}
            {...register("category")}
          >
            {CONTACT_CATEGORIES.map((category) => (
              <option key={category} value={category} className="bg-slate-950 text-white">
                {category}
              </option>
            ))}
          </select>
        </div>
        {errors.category ? (
          <p id="category-error" className="text-xs font-medium text-rose-400">
            {errors.category.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="flex items-center gap-1 text-sm font-medium text-slate-200">
          Message <span aria-hidden="true" className="text-indigo-300">*</span>
        </label>
        <textarea
          id="message"
          rows={7}
          placeholder="Tell us what happened and how we can help."
          className="flex w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white shadow-sm transition-all duration-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-400"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          {...register("message")}
        />
        {errors.message ? (
          <p id="message-error" className="text-xs font-medium text-rose-400">
            {errors.message.message}
          </p>
        ) : (
          <p className="text-xs text-slate-400">
            Please include enough detail so we can help you quickly.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        We will reply from {CONTACT_SUPPORT_EMAIL} and never share your contact details with advertisers.
      </div>

      <LoadingButton
        type="submit"
        loading={isSubmitting}
        loadingLabel="Sending message..."
        icon={<Send className="size-4" />}
      >
        Send Message
      </LoadingButton>
    </form>
  );
}
