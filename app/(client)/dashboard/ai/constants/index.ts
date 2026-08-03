/**
 * AI Assistant — static configuration constants.
 */

import {
  FileText,
  MessageCircle,
  SearchCheck,
  PenSquare,
  Mail,
  TrendingUp,
  Map,
  BarChart3,
  Building2,
} from "lucide-react";
import type { QuickAction } from "../types";

// ─── Quick Actions ────────────────────────────────────────────────────────────

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "resume-lab",
    title: "Resume Lab",
    description:
      "Analyze your resume, get ATS score, improve keywords and optimize content.",
    cta: "Analyze Resume",
    icon: FileText,
    iconGradient: "from-blue-600/20 to-blue-500/10",
    iconColor: "text-blue-400",
    prompt: "Review my resume and give me an ATS score with improvement suggestions.",
    tool: "resume",
  },
  {
    id: "interview-coach",
    title: "Interview Coach",
    description:
      "Practice technical and HR interviews with AI-powered coaching.",
    cta: "Start Interview",
    icon: MessageCircle,
    iconGradient: "from-purple-600/20 to-purple-500/10",
    iconColor: "text-purple-400",
    prompt: "Help me prepare for a technical interview. Start with common coding questions.",
    tool: "interview",
  },
  {
    id: "jd-analyzer",
    title: "JD Analyzer",
    description:
      "Extract required skills, responsibilities and compare with your resume.",
    cta: "Analyze JD",
    icon: SearchCheck,
    iconGradient: "from-emerald-600/20 to-emerald-500/10",
    iconColor: "text-emerald-400",
    prompt: "Analyze this job description and compare it with my skills.",
    tool: "jd",
  },
  {
    id: "cover-letter",
    title: "Cover Letter Generator",
    description:
      "Generate personalized, compelling cover letters within seconds.",
    cta: "Generate Cover Letter",
    icon: PenSquare,
    iconGradient: "from-amber-600/20 to-amber-500/10",
    iconColor: "text-amber-400",
    prompt: "Generate a personalized cover letter for a Software Engineer role.",
    tool: "cover-letter",
  },
  {
    id: "recruiter-message",
    title: "Recruiter Message",
    description:
      "Generate LinkedIn messages and recruiter outreach emails that get replies.",
    cta: "Generate Message",
    icon: Mail,
    iconGradient: "from-rose-600/20 to-rose-500/10",
    iconColor: "text-rose-400",
    prompt: "Generate a LinkedIn cold outreach message to a recruiter at Google.",
    tool: "recruiter-message",
  },
  {
    id: "salary-insights",
    title: "Salary Insights",
    description:
      "Know your market value based on experience, role, and location.",
    cta: "Check Salary",
    icon: TrendingUp,
    iconGradient: "from-cyan-600/20 to-cyan-500/10",
    iconColor: "text-cyan-400",
    prompt: "What is the market salary range for a Senior Frontend Engineer in San Francisco?",
    tool: "salary",
  },
  {
    id: "career-roadmap",
    title: "Career Roadmap",
    description:
      "Generate a personalized learning roadmap to reach your dream job.",
    cta: "Build Roadmap",
    icon: Map,
    iconGradient: "from-violet-600/20 to-violet-500/10",
    iconColor: "text-violet-400",
    prompt: "Create a 6-month career roadmap to become a Senior Full Stack Engineer.",
    tool: "roadmap",
  },
  {
    id: "skill-gap",
    title: "Skill Gap Analysis",
    description:
      "Compare your current skills with any target role to identify gaps.",
    cta: "Analyze Skills",
    icon: BarChart3,
    iconGradient: "from-indigo-600/20 to-indigo-500/10",
    iconColor: "text-indigo-400",
    prompt: "Do a skill gap analysis for a Senior React Developer role compared to my profile.",
    tool: "skill-gap",
  },
  {
    id: "company-research",
    title: "Company Research",
    description:
      "Learn about interview process, culture, and hiring insights for any company.",
    cta: "Research Company",
    icon: Building2,
    iconGradient: "from-teal-600/20 to-teal-500/10",
    iconColor: "text-teal-400",
    prompt: "Tell me about Amazon's interview process, culture, and hiring insights.",
    tool: "company",
  },
];

// ─── Suggested Prompts (fallback) ─────────────────────────────────────────────

export const SUGGESTED_PROMPTS: string[] = [
  "Review my Resume",
  "Improve Cover Letter",
  "Analyze this Job Description",
  "Prepare Interview Questions",
  "Generate Recruiter Message",
  "Optimize LinkedIn Profile",
  "Create Career Roadmap",
  "Find Skill Gaps",
];

// ─── Routes ───────────────────────────────────────────────────────────────────

export const AI_ROUTE = "/dashboard/ai" as const;
