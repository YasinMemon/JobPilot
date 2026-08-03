import { ProtectedRoute, RoleGuard } from "@/components/auth/guards";
// import React from "react";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {" "}
      <ProtectedRoute>
        <RoleGuard allowedRoles={["admin"]}>{children}</RoleGuard>
      </ProtectedRoute>
    </>
  );
}
