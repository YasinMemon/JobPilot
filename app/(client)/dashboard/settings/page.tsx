"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User,
  FileText,
  Link2,
  ChevronRight,
  Settings,
  Loader2,
} from "lucide-react";
import ConnectedAccountsTab from "@/components/settings/ConnectedAccountsTab";

// ─── Types ─────────────────────────────────────────────────────────────────
type TabId = "profile" | "resume" | "connected-accounts";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: Tab[] = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    description: "Manage your personal information",
  },
  {
    id: "resume",
    label: "Resume",
    icon: FileText,
    description: "Upload and manage your résumé",
  },
  {
    id: "connected-accounts",
    label: "Connected Accounts",
    icon: Link2,
    description: "Link Google and other accounts",
  },
];

// ─── Profile tab (redirect shortcut) ───────────────────────────────────────
function ProfileTab() {
  const router = useRouter();
  useEffect(() => {
    router.push("/dashboard/profile");
  }, [router]);
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
    </div>
  );
}

// ─── Resume tab placeholder ─────────────────────────────────────────────────
function ResumeTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#27272a] bg-[#1c1c1c]">
        <FileText className="h-6 w-6 text-zinc-500" />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-white">Resume Manager</p>
        <p className="mt-1 text-[12px] text-zinc-500">Coming soon.</p>
      </div>
    </div>
  );
}

// ─── Sidebar item ───────────────────────────────────────────────────────────
function SidebarItem({
  tab,
  active,
  onClick,
}: {
  tab: Tab;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      id={`settings-tab-${tab.id}`}
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-blue-600/15 to-purple-600/10 border border-blue-500/15 text-white"
          : "border border-transparent text-zinc-400 hover:bg-[#1c1c1c] hover:text-zinc-200"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
          active ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-[#1c1c1c] group-hover:bg-[#232323]"
        }`}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-none truncate">
          {tab.label}
        </p>
        <p
          className={`mt-0.5 text-[11px] truncate transition-colors ${
            active ? "text-zinc-400" : "text-zinc-600 group-hover:text-zinc-500"
          }`}
        >
          {tab.description}
        </p>
      </div>
      <ChevronRight
        className={`h-3.5 w-3.5 shrink-0 transition-all duration-200 ${
          active ? "text-zinc-400 translate-x-0.5" : "text-zinc-700 opacity-0 group-hover:opacity-100"
        }`}
      />
    </button>
  );
}

// ─── Inner component that uses useSearchParams ──────────────────────────────
function SettingsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && TABS.some((t) => t.id === tabParam)
      ? tabParam
      : "connected-accounts",
  );

  // Sync URL when tab changes
  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    router.replace(`/dashboard/settings?tab=${id}`, { scroll: false });
  };

  // Sync tab from URL (e.g., after OAuth redirect back)
  useEffect(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="min-h-full bg-[#0a0a0a] p-5 lg:p-8">
      {/* ── Page header ─── */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-[#27272a]">
          <Settings className="h-4 w-4 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold tracking-tight text-white">
            Settings
          </h1>
          <p className="text-[12px] text-zinc-500">
            Manage your account preferences
          </p>
        </div>
      </div>

      <div className="flex gap-5">
        {/* ── Sidebar ─── */}
        <aside className="w-56 shrink-0 space-y-1">
          {TABS.map((tab) => (
            <SidebarItem
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
            />
          ))}
        </aside>

        {/* ── Content panel ─── */}
        <main className="flex-1 min-w-0 rounded-2xl border border-[#27272a] bg-[#111111] p-6">
          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-1.5 text-[11px] text-zinc-600">
            <span>Settings</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-400">
              {TABS.find((t) => t.id === activeTab)?.label}
            </span>
          </div>

          {/* Tab panels */}
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "resume" && <ResumeTab />}
          {activeTab === "connected-accounts" && <ConnectedAccountsTab />}
        </main>
      </div>
    </div>
  );
}

// ─── Page (wraps inner component in Suspense for useSearchParams) ────────────
export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-[#0a0a0a]">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      }
    >
      <SettingsInner />
    </Suspense>
  );
}
