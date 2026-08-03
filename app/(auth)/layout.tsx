import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import { PublicRoute } from "@/components/auth/guards";
import { AuthLoadingScreen } from "@/components/auth/guards";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // PublicRoute uses useSearchParams → must be wrapped in Suspense
    <Suspense fallback={<AuthLoadingScreen />}>
      <PublicRoute>
        <AuthLayout>{children}</AuthLayout>
      </PublicRoute>
    </Suspense>
  );
}