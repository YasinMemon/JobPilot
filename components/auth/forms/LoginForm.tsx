"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Mail, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthCard from "../AuthCard";
import Input from "../Input";
import PasswordInput from "../PasswordInput";
import LoadingButton from "../LoadingButton";
import SocialLoginButton from "../SocialLoginButton";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export default function LoginForm() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const { email, password } = values;
    const payload = { email, password };

    if (googleLoading || isSubmitting) {
      return;
    }

    try {
      setGoogleLoading(true);
      const response = await authClient.signIn.email(payload);

      if (response.error) {
        toast.error(response.error.message);
      }

      if (response.data?.user) {
        toast.success("Login successful! Redirecting to dashboard...");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please check your credentials and try again.");
    } finally {
      setGoogleLoading(false);
    }
  });

  const handleGoogleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setGoogleLoading(true);

    try {
      const { error } = await authClient.signIn.social(
        {
          provider: "google",
          callbackURL: "/dashboard",
        },
        {
          onError: (ctx) => {
            toast.error(ctx.error.message);
            console.error("Google login error:", ctx.error);
            setGoogleLoading(false);
          },
        },
      );

      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch {
      toast.error("Google login failed");
      setGoogleLoading(false);
    }
  };

  return (
    <AuthCard
      badge="Secure sign in"
      title="Welcome Back 👋"
      subtitle="Sign in to continue managing your job applications with AI."
      footer={
        <p className="text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-300 transition hover:text-indigo-200"
          >
            Sign Up
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
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

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register("password")}
          required
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              className="size-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500"
              {...register("rememberMe")}
            />
            Remember me
          </label>

          <Link
            href="/forgot-password"
            className="text-sm font-medium text-indigo-300 transition hover:text-indigo-200"
          >
            Forgot password?
          </Link>
        </div>

        <LoadingButton
          type="submit"
          loading={isSubmitting || googleLoading}
          loadingLabel="Signing in..."
        >
          Sign In
        </LoadingButton>

        <div className="relative py-1">
          <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
          <span className="relative mx-auto block w-fit rounded-full bg-[#09090b] px-3 text-xs font-medium uppercase tracking-[0.28em] text-slate-500">
            or continue with
          </span>
        </div>

        <SocialLoginButton
          type="button"
          label="Sign in with Google"
          icon={<Globe className="size-4" />}
          onClick={(e) => handleGoogleLogin(e)}
          disabled={googleLoading || isSubmitting}
        />

        {googleLoading ? (
          <p className="text-center text-xs text-slate-400" aria-live="polite">
            Connecting your Google account...
          </p>
        ) : null}

        <div className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <ShieldCheck className="size-4" />
          Your credentials are handled securely.
        </div>
      </form>
    </AuthCard>
  );
}
