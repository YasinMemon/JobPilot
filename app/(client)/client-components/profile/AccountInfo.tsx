"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import InfoCard from "../ui/InfoCard";
import { User } from "@/types/user";
import ChangePasswordModal from "./ChangePasswordModal";

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 font-medium">{value}</p>
  </div>
);

export default function AccountInfo({ user }: { user: User | null }) {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  return (
    <>
      <InfoCard title="Account Information">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Account Type" value={user?.accountType || "Free"} />

          <Field
            label="Email Verified"
            value={user?.emailVerified ? "Yes ✅" : "No ❌"}
          />

          <Field label="Member Since" value={user?.memberSince || "July 2026"} />

          <Field label="Last Login" value={user?.lastLogin || "Today"} />
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => setIsChangePasswordOpen(true)}
          >
            Change Password
          </Button>

          {/* <Button variant="destructive">Delete Account</Button> */}
        </div>
      </InfoCard>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
}
