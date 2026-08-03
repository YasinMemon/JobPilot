import type { Metadata } from "next";
import LoginForm from "@/components/auth/forms/LoginForm";

export const metadata: Metadata = {
  title: "Login | JobPilot",
  description: "Sign in to manage your job applications with AI.",
};

export default function Page() {
  return <LoginForm />;
}