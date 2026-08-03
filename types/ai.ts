/**
 * AI Assistant — Global TypeScript types.
 *
 * Shared across models, services, API routes, and frontend hooks.
 * Keep in sync with Mongoose schemas.
 */

// ─── Role ─────────────────────────────────────────────────────────────────────

export type AIMessageRole = "user" | "assistant" | "system";

// ─── Activity Types ───────────────────────────────────────────────────────────

export type AIActivityType =
  | "resume"
  | "ats"
  | "interview"
  | "jd"
  | "cover_letter"
  | "recruiter_message"
  | "salary"
  | "roadmap"
  | "skill_gap"
  | "company"
  | "chat";

// ─── AI Tool Keys ─────────────────────────────────────────────────────────────

export type AIToolKey =
  | "resume"
  | "ats"
  | "interview"
  | "jd"
  | "cover-letter"
  | "recruiter-message"
  | "salary"
  | "roadmap"
  | "skill-gap"
  | "company";

// ─── Attachment ───────────────────────────────────────────────────────────────

export interface AIAttachment {
  /** Cloudinary public_id or S3 key */
  fileId: string;
  /** Public URL */
  url: string;
  /** Original filename */
  fileName: string;
  /** "resume" | "jd" | "other" */
  attachmentType: "resume" | "jd" | "other";
  /** Extracted text content (for AI context) */
  textContent?: string;
  /** Mime type */
  mimeType: string;
  /** File size in bytes */
  size: number;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface IConversation {
  _id: string;
  userId: string;
  title: string;
  lastMessage: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface IMessage {
  _id: string;
  conversationId: string;
  userId: string;
  role: AIMessageRole;
  content: string;
  attachments?: AIAttachment[];
  toolUsed?: AIToolKey | null;
  tokens?: number;
  createdAt: string;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export interface IActivity {
  _id: string;
  userId: string;
  type: AIActivityType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Usage ────────────────────────────────────────────────────────────────────

export interface IUsage {
  _id: string;
  userId: string;
  /** YYYY-MM-DD */
  date: string;
  messages: number;
  tokensUsed: number;
  creditsUsed: number;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface ChatRequestPayload {
  conversationId?: string;
  message: string;
  tool?: AIToolKey;
  attachments?: AIAttachment[];
}

export interface CreateConversationPayload {
  title?: string;
}

export interface UpdateConversationPayload {
  title?: string;
  isPinned?: boolean;
  isArchived?: boolean;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ConversationWithMessages {
  conversation: IConversation;
  messages: IMessage[];
}

export interface UsageSummary {
  creditsUsed: number;
  creditsTotal: number;
  messages: number;
  tokensUsed: number;
  creditsRemaining: number;
  percentUsed: number;
  resetAt: string;
}

// ─── Groq Message ─────────────────────────────────────────────────────────────

export interface GroqMessage {
  role: AIMessageRole;
  content: string;
}

// ─── User Context for AI ──────────────────────────────────────────────────────

export interface UserAIContext {
  fullName: string;
  currentJobTitle?: string;
  currentRole?: string;
  skills: string[];
  yearsOfExperience?: string;
  targetRole?: string;
  location?: string;
  resumeUrl?: string;
  recentApplications?: string[];
}
