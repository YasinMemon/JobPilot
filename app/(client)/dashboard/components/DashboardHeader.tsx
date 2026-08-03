"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import type { UseUserProfileReturn } from "../hooks/useUserProfile";
import { ROUTES } from "../constants";

interface DashboardHeaderProps
  extends Pick<
    UseUserProfileReturn,
    "userName" | "userInitial" | "userAvatar" | "avatarImgError" | "setAvatarImgError"
  > {}

/**
 * Dashboard page header: welcome message, notification bell, and avatar link.
 * Receives all display data via props — pure rendering, no data fetching.
 */
export const DashboardHeader = React.memo(function DashboardHeader({
  userName,
  userInitial,
  userAvatar,
  avatarImgError,
  setAvatarImgError,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">👋</span>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Welcome back,{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {userName || "there"}
            </span>
          </h1>
        </div>
        <p className="text-sm text-zinc-500">
          Generate personalized cold emails that actually get replies.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#27272a] bg-[#111111] text-zinc-500 transition-all duration-200 hover:border-[#3f3f46] hover:text-zinc-200"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
        </button>
        <Link
          href={ROUTES.PROFILE}
          aria-label="Profile"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden transition-transform duration-200 hover:scale-105 ring-2 ring-transparent hover:ring-blue-500/40"
        >
          {userAvatar && !avatarImgError ? (
            <Image
              src={userAvatar}
              alt="profile"
              fill
              sizes="36px"
              className="object-cover"
              onError={() => setAvatarImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-purple-900/20">
              {userInitial}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
});
