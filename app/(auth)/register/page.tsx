import type { Metadata } from "next";
import RegisterForm from "@/components/auth/forms/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account | JobPilot",
  description: "Create your JobPilot account and start applying smarter with AI.",
};

export default function Page() {
  return <RegisterForm />;
}