/**
 * AI Assistant — static tips data.
 *
 * Tips are static content and intentionally kept here.
 * All other mock data (conversations, activities, usage) has been
 * replaced with real API data.
 */

import type { AITip } from "../types";

// ─── Tips ─────────────────────────────────────────────────────────────────────

export const AI_TIPS: AITip[] = [
  {
    id: "tip-1",
    emoji: "⚡",
    text: "Recruiters spend only 7 seconds reviewing resumes. Make the first half count.",
  },
  {
    id: "tip-2",
    emoji: "📊",
    text: "Use measurable achievements instead of responsibilities. Numbers stand out.",
  },
  {
    id: "tip-3",
    emoji: "🎯",
    text: "Tailor your resume for each job description. Generic resumes rarely pass ATS.",
  },
  {
    id: "tip-4",
    emoji: "🤝",
    text: "Personalized LinkedIn messages get 3× more replies than generic connection requests.",
  },
  {
    id: "tip-5",
    emoji: "🧠",
    text: "Practice STAR-format answers for behavioral interviews to structure your stories.",
  },
  {
    id: "tip-6",
    emoji: "💼",
    text: "Apply to jobs within the first 24 hours of posting. Early applicants get more callbacks.",
  },
  {
    id: "tip-7",
    emoji: "🔑",
    text: "Including the exact job title from the posting in your resume improves ATS ranking.",
  },
];
