import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/forms/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | JobPilot",
  description: "Request a password reset link for your JobPilot account.",
};

export default function Page() {
  return <ForgotPasswordForm />;
}