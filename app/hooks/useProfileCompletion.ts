"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProfileCompletionData } from "@/components/ProfileCompletionModal";

const DISMISSED_KEY = "jp_profile_modal_dismissed";

export interface UseProfileCompletionReturn {
  completionData: ProfileCompletionData | null;
  showModal: boolean;
  showBanner: boolean;
  dismissModal: () => void;
  dismissBanner: () => void;
  refetch: () => Promise<void>;
}

export function useProfileCompletion(): UseProfileCompletionReturn {
  const [completionData, setCompletionData] =
    useState<ProfileCompletionData | null>(null);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const fetchCompletion = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/completion", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setCompletionData({
          profileCompleted: data.profileCompleted,
          completionPercentage: data.completionPercentage,
          missingFields: data.missingFields,
        });
      }
    } catch {
      // Silently fail — don't block the dashboard
    }
  }, []);

  useEffect(() => {
    // Restore dismissal state from sessionStorage
    try {
      const dismissed = sessionStorage.getItem(DISMISSED_KEY);
      if (dismissed === "true") {
        setModalDismissed(true);
      }
    } catch {
      // sessionStorage unavailable
    }
    fetchCompletion();
  }, [fetchCompletion]);

  const dismissModal = useCallback(() => {
    setModalDismissed(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
  }, []);

  const isIncomplete = completionData
    ? !completionData.profileCompleted
    : false;

  const showModal = isIncomplete && !modalDismissed;
  const showBanner = isIncomplete && modalDismissed && !bannerDismissed;

  return {
    completionData,
    showModal,
    showBanner,
    dismissModal,
    dismissBanner,
    refetch: fetchCompletion,
  };
}
