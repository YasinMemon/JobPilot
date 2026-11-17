"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user";
import { Mail, Phone, MapPin, Download, Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { buildCloudinaryUrl } from "@/lib/cloudinaryUrl";

export default function ProfileSidebar({
  user,
  isEditing,
  setIsEditing,
  setProfile,
}: {
  user: User | null;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  setProfile: React.Dispatch<React.SetStateAction<User | null>>;
}) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const rawAvatar = user?.avatar || user?.image || null;

  // Apply face-crop transformation via Cloudinary URL if it's a Cloudinary image
  const avatarSrc = rawAvatar
    ? rawAvatar.includes("res.cloudinary.com")
      ? buildCloudinaryUrl(rawAvatar.split("/upload/")[1] || rawAvatar)
      : rawAvatar
    : "https://i.pravatar.cc/200";

  const handleAvatarSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post<{
        success: boolean;
        data: { url: string };
        message: string;
      }>("/api/upload/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setProfile((prev) => ({
          ...prev!,
          avatar: response.data.data.url,
        }));
      }
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Avatar upload failed.";
      setAvatarError(message);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleDownloadResume = () => {
    if (!user?.resume) return;
    const link = document.createElement("a");
    link.href = user.resume;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  return (
    <div className="rounded-2xl border bg-background p-6">
      <div className="flex flex-col">
        {/* Avatar with upload overlay */}
        <div className="relative w-28 h-28 group">
          <Image
            src={avatarSrc}
            alt="avatar"
            fill
            className="rounded-full object-cover"
            sizes="112px"
          />

          {/* Camera overlay — only visible in edit mode */}
          {isEditing && (
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              aria-label="Change profile picture"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <>
                  <Camera className="h-6 w-6 text-white" />
                  <span className="mt-1 text-[10px] text-white font-medium">
                    Change
                  </span>
                </>
              )}
            </button>
          )}

          {/* Hidden file input */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarSelect}
            disabled={uploadingAvatar}
          />
        </div>

        {/* Avatar error message */}
        {avatarError && (
          <p className="mt-2 text-xs text-destructive">{avatarError}</p>
        )}
        {isEditing && !avatarError && (
          <p className="mt-2 text-xs text-muted-foreground">
            Hover avatar to change · JPG, PNG, WebP · Max 5 MB
          </p>
        )}

        <h2 className="mt-4 text-xl font-bold">{user?.fullName}</h2>
        <p className="text-muted-foreground">{user?.currentJobTitle}</p>
      </div>

      <div className="mt-8 space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <Mail size={18} />
          {user?.email}
        </div>

        <div className="flex items-center gap-3">
          <Phone size={18} />
          {user?.phone}
        </div>

        <div className="flex items-center gap-3">
          <MapPin size={18} />
          {user?.currentLocation}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isEditing ? (
          <Button onClick={() => setIsEditing(false)} variant="outline">
            Cancel
          </Button>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
        <Button
          variant="outline"
          onClick={handleDownloadResume}
          disabled={!user?.resume}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Resume
        </Button>
      </div>
    </div>
  );
}
