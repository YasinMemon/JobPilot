"use client";

import { useState, useEffect } from "react";
import { buildCloudinaryUrl } from "@/lib/cloudinaryUrl";
import { fetchUserProfile } from "../services/dashboard.service";
import { AVATAR_CLOUDINARY_TRANSFORM } from "../constants";

export interface UseUserProfileReturn {
  userName: string;
  userInitial: string;
  userAvatar: string | null;
  avatarImgError: boolean;
  setAvatarImgError: (value: boolean) => void;
}

/**
 * Fetches the current user's profile and derives display-ready values:
 * first name, avatar initial, and resolved Cloudinary URL.
 */
export function useUserProfile(): UseUserProfileReturn {
  const [userName, setUserName] = useState("");
  const [userInitial, setUserInitial] = useState("U");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [avatarImgError, setAvatarImgError] = useState(false);

  useEffect(() => {
    fetchUserProfile()
      .then((response) => {
        if (response.success && response.data) {
          const name = response.data.fullName ?? response.data.name ?? "there";
          setUserName(name.split(" ")[0]);
          setUserInitial((name[0] ?? "U").toUpperCase());

          const raw = response.data.avatar ?? response.data.image ?? null;
          if (raw) {
            const resolved = raw.includes("res.cloudinary.com")
              ? buildCloudinaryUrl(raw, AVATAR_CLOUDINARY_TRANSFORM)
              : raw;
            setUserAvatar(resolved);
          }
        }
      })
      .catch(() => {
        // Silently fail — non-critical, UI degrades gracefully
      });
  }, []);

  return { userName, userInitial, userAvatar, avatarImgError, setAvatarImgError };
}
