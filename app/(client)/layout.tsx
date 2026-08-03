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
      <RoleGuard allowedRoles={["user"]}>
        <div className="dark flex min-h-screen w-full bg-[#0a0a0a]">
          <DashboardSidebar />
          <ProfileCompletionProvider>
            <main className="flex-1 overflow-y-auto">{children}</main>
          </ProfileCompletionProvider>
          <Toaster position="top-center" richColors />
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
