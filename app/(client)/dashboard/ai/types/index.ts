/**
 * AI Assistant feature — TypeScript types (UI layer).
 *
 * These are the UI-facing types. For the API/DB types, see @/types/ai.ts
 */

import type { AIToolKey } from "@/types/ai";

// ─── Message (UI) ─────────────────────────────────────────────────────────────

export type MessageRole = "assistant" | "user";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** ISO timestamp string */
  timestamp: string;
  /** True while streaming is in progress for this message */
  isStreaming?: boolean;
  toolUsed?: AIToolKey;
}

// ─── Quick Action ─────────────────────────────────────────────────────────────

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  cta: string;
  /** Lucide icon component type */
  icon: React.ElementType;
  /** Tailwind gradient classes for the icon container */
  iconGradient: string;
  /** Tailwind text color class for the icon */
  iconColor: string;
  /** Prompt injected into chat when the CTA is clicked */
  prompt: string;
  /** Tool key for the specialized endpoint */
  tool?: AIToolKey;
}

// ─── Recent Chat ──────────────────────────────────────────────────────────────

export interface RecentChat {
  id: string;
  title: string;
  preview: string;
  /** ISO timestamp string */
  timestamp: string;
  /** Tag label shown on the chip */
  tag: string;
  /** Tailwind classes for the tag */
  tagClass: string;
}

// ─── AI Activity ─────────────────────────────────────────────────────────────

export type ActivityType =
  | "resume"
  | "ats"
  | "email"
  | "jd"
  | "interview"
  | "cover_letter"
  | "recruiter_message"
  | "salary"
  | "roadmap"
  | "skill_gap"
  | "company"
  | "chat";

export interface AIActivity {
  id: string;
  type: ActivityType;
  label: string;
  detail: string;
  /** ISO timestamp string */
  timestamp: string;
  /** Tailwind color class for the timeline dot */
  dotColor: string;
}

// ─── Usage ───────────────────────────────────────────────────────────────────

export interface AIUsage {
  used: number;
  total: number;
  label: string;
}

// ─── Tips ────────────────────────────────────────────────────────────────────

export interface AITip {
  id: string;
  text: string;
  emoji: string;
}

// ─── Chat Session ──────────────────────────────────────────────────────────────

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
}
