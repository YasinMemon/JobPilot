"use client";

/**
 * ProfileCompletionProvider
 *
 * Renders as a client-side provider inside the dashboard layout (server component).
 * - Shows the full onboarding modal on every dashboard route when profileCompleted=false
 * - Exposes completion state via ProfileCompletionContext so child pages can render the banner
 */

import React, { createContext, useContext, Suspense } from "react";
import dynamic from "next/dynamic";
import { useProfileCompletion, UseProfileCompletionReturn } from "@/app/hooks/useProfileCompletion";

// Lazy-load heavy modal to keep layout bundle light
const ProfileCompletionModal = dynamic(
  () => import("@/components/ProfileCompletionModal"),
  { ssr: false },
);

// ─── Context ──────────────────────────────────────────────────────────────────
const ProfileCompletionContext = createContext<UseProfileCompletionReturn | null>(
  null,
);

export function useProfileCompletionContext() {
  return useContext(ProfileCompletionContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ProfileCompletionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const completion = useProfileCompletion();
  const { completionData, showModal, dismissModal } = completion;

  return (
    <ProfileCompletionContext.Provider value={completion}>
      {/* Modal — z-50 overlay, rendered above everything */}
      {showModal && completionData && (
        <Suspense fallback={null}>
          <ProfileCompletionModal data={completionData} onDismiss={dismissModal} />
        </Suspense>
      )}

      {children}
    </ProfileCompletionContext.Provider>
  );
}
