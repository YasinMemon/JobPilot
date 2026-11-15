"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarItem from "./sidbar-item";
import { dashboardNav } from "./dashboard-nav";
import { Zap, LogOut, Loader2, Menu, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { buildCloudinaryUrl } from "@/lib/cloudinaryUrl";

/** Resolve the best avatar URL for the sidebar, applying Cloudinary face-crop */
function resolveAvatar(
  avatar?: string | null,
  sessionImage?: string | null,
): string | null {
  const raw = avatar || sessionImage || null;
  if (!raw) return null;
  if (raw.includes("res.cloudinary.com")) {
    // Apply a compact face-crop (80×80 is enough for the 36px display slot)
    return buildCloudinaryUrl(raw, "c_fill,g_face,h_80,w_80,q_auto,f_auto");
  }
  return raw; // Google OAuth URL or any other CDN
}

interface SidebarProfile {
  avatar?: string;
  image?: string;
  fullName?: string;
  email?: string;
}

export default function DashboardSidebar() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarProfile, setSidebarProfile] = useState<SidebarProfile | null>(
    null,
  );
  const [imgError, setImgError] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: session } = authClient.useSession();
  const user = session?.user;

  // Derive initials from name (e.g. "Yasin Memon" → "YM")
  const displayName = sidebarProfile?.fullName || user?.name || "";
  const displayEmail = sidebarProfile?.email || user?.email || "";
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const avatarSrc = resolveAvatar(
    sidebarProfile?.avatar,
    sidebarProfile?.image || user?.image,
  );

  // Fetch profile data for avatar (lightweight – only runs once on mount)
  useEffect(() => {
    if (!user) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSidebarProfile({
            avatar: res.data?.avatar,
            image: res.data?.image,
            fullName: res.data?.fullName,
            email: res.data?.email,
          });
        }
      })
      .catch(() => {/* silently ignore – session data is the fallback */});
  }, [user]);

  // Mobile drawer: close on Escape, lock body scroll while open
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Logged out successfully.");
            router.push("/login");
          },
        },
      });
    } catch {
      toast.error("Failed to log out. Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <>
      {/* ── Mobile / tablet top bar ── */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[#27272a] bg-[#0f0f0f]/95 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-900/30">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white">
            Job<span className="gradient-text">Pilot</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="dashboard-sidebar"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#27272a] bg-[#111111] text-zinc-300 transition-colors hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── Mobile backdrop ── */}
      <div
        onClick={closeMobile}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

    <aside
      id="dashboard-sidebar"
      className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-64 max-w-[85vw] shrink-0 flex-col border-r border-[#27272a] bg-[#0f0f0f] transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* ── Logo ── */}
      <div className="relative border-b border-[#27272a] px-5 py-5">
        <button
          type="button"
          onClick={closeMobile}
          aria-label="Close navigation menu"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-[#1c1c1c] hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-900/30 group-hover:shadow-purple-700/40 transition-shadow duration-300">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[15px] font-bold tracking-tight text-white">
              Job<span className="gradient-text">Pilot</span>
            </span>
          </div>
        </Link>
        <p className="mt-2 text-[11px] text-zinc-500 font-medium tracking-wide uppercase pl-0.5">
          AI Email Workspace
        </p>
      </div>

      {/* ── Navigation ── */}
      <nav onClick={closeMobile} className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Main
        </p>
        {dashboardNav.slice(0, 5).map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            title={item.title}
            icon={item.icon}
          />
        ))}
        <div className="my-2 border-t border-[#27272a]" />
        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Account
        </p>
        {dashboardNav.slice(5).map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            title={item.title}
            icon={item.icon}
          />
        ))}
      </nav>

      {/* ── User Card + Logout ── */}
      <div className="border-t border-[#27272a] p-3 space-y-2">
        <Link
          href="/dashboard/profile"
          onClick={closeMobile}
          className="flex items-center gap-3 rounded-xl bg-[#1c1c1c] hover:bg-[#232323] border border-[#27272a] px-3 py-3 transition-all duration-200 group"
        >
          {/* Avatar: photo → initials fallback */}
          <div className="relative h-9 w-9 shrink-0">
            {avatarSrc && !imgError ? (
              <Image
                src={avatarSrc}
                alt={displayName || "avatar"}
                fill
                sizes="36px"
                className="rounded-full object-cover ring-2 ring-[#27272a] group-hover:ring-blue-500/40 transition-all duration-200"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-purple-900/20">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white truncate">
              {displayName || "Loading…"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <p className="text-[11px] text-zinc-500 truncate">
                {displayEmail}
              </p>
            </div>
          </div>
        </Link>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          ) : (
            <LogOut className="h-4 w-4 shrink-0" />
          )}
          {loggingOut ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </aside>
    </>
  );
}
