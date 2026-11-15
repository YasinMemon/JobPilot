import { Toaster } from "sonner";
import DashboardSidebar from "./client-components/ui/DashboardSidebar";
import { ProfileCompletionProvider } from "./client-components/ProfileCompletionProvider";
import { ProtectedRoute, RoleGuard } from "@/components/auth/guards";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["user", "admin"]}>
        <div className="dark flex min-h-screen w-full flex-col bg-[#0a0a0a] lg:flex-row">
          <DashboardSidebar />
          <ProfileCompletionProvider>
            <main className="min-w-0 flex-1 lg:overflow-y-auto">{children}</main>
          </ProfileCompletionProvider>
          <Toaster position="top-center" richColors />
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
