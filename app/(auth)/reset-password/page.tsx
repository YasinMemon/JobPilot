import type { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/forms/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | JobPilot",
  description: "Create a new password for your JobPilot account.",
};

export default function Page() {
  return <ResetPasswordForm />;
}