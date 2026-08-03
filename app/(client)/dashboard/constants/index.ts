import {
  Mail,
  Send,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { DashboardStats } from "../types";

// ─── Routes ───────────────────────────────────────────────────────────────────

export const ROUTES = {
  APPLICATIONS: "/dashboard/applications",
  PROFILE: "/dashboard/profile",
  SETTINGS_CONNECTED_ACCOUNTS: "/dashboard/settings?tab=connected-accounts",
} as const;

// ─── Status Badge Classes ────────────────────────────────────────────────────

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  Applied: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Interview: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Offer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Hired: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Assessment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Shortlisted: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Viewed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  Unknown: "bg-zinc-500/10 text-zinc-500 border-zinc-700/40",
};

export const DEFAULT_BADGE_CLASS =
  "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

// ─── Empty Email State Tags ──────────────────────────────────────────────────

export const EMPTY_EMAIL_STATE_TAGS = [
  "AI-personalized",
  "ATS-optimized",
  "One-click copy",
] as const;

// ─── Recent Applications ─────────────────────────────────────────────────────

export const RECENT_APPS_LIMIT = 5;
export const RECENT_APPS_SORT_BY = "receivedAt" as const;
export const RECENT_APPS_SORT_ORDER = "desc" as const;

// ─── Stat Card Config ────────────────────────────────────────────────────────

export interface StatCardConfig {
  key: string;
  icon: React.ElementType;
  label: string;
  iconBg: string;
  iconColor: string;
  getValue: (stats: DashboardStats | null) => string;
  getTrend: (stats: DashboardStats | null) => string;
  isTrendUp: (stats: DashboardStats | null) => boolean;
}

export const STAT_CARDS_CONFIG: StatCardConfig[] = [
  {
    key: "total",
    icon: Mail,
    label: "Total Applications",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    getValue: (s) => String(s?.total ?? 0),
    getTrend: (s) => (s?.total ? `${s.total} tracked` : "No data yet"),
    isTrendUp: (s) => (s?.total ?? 0) > 0,
  },
  {
    key: "applied",
    icon: Send,
    label: "Applied",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    getValue: (s) => String(s?.applied ?? 0),
    getTrend: (s) => (s?.applied ? `${s.applied} sent` : "None yet"),
    isTrendUp: (s) => (s?.applied ?? 0) > 0,
  },
  {
    key: "successRate",
    icon: TrendingUp,
    label: "Success Rate",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    getValue: (s) => `${s?.successRate ?? 0}%`,
    getTrend: (s) =>
      (s?.offer ?? 0) + (s?.hired ?? 0) > 0
        ? `${(s?.offer ?? 0) + (s?.hired ?? 0)} offer/hired`
        : "No offers yet",
    isTrendUp: (s) => (s?.successRate ?? 0) > 0,
  },
  {
    key: "interview",
    icon: Zap,
    label: "Interviews",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    getValue: (s) => String(s?.interview ?? 0),
    getTrend: (s) =>
      (s?.interview ?? 0) > 0 ? `${s?.interview} scheduled` : "None yet",
    isTrendUp: (s) => (s?.interview ?? 0) > 0,
  },
];

// ─── Attachment Validation ────────────────────────────────────────────────────

export const MAX_ATTACHMENT_FILES = 10;
export const MAX_TOTAL_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/** MIME types accepted for attachments. */
export const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
]);

/** Human-readable labels for the file picker `accept` attribute. */
export const ATTACHMENT_ACCEPT =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.zip";

// ─── Avatar ───────────────────────────────────────────────────────────────────

export const AVATAR_CLOUDINARY_TRANSFORM =
  "c_fill,g_face,h_80,w_80,q_auto,f_auto";
