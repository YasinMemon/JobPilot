/**
 * Dashboard feature types.
 *
 * Re-exports the canonical global types instead of duplicating them.
 * Add dashboard-specific types here if they are never needed elsewhere.
 */

export type {
  ApplicationStats as DashboardStats,
  Application as RecentApplication,
} from "@/types/applications/type";

// ─── Attachment ───────────────────────────────────────────────────────────────

/** A file the user has selected to attach to the outgoing email. */
export interface AttachmentFile {
  /** Browser File object (used to build FormData). */
  file: File;
  /** Display name derived from file.name. */
  name: string;
  /** Human-readable size string, e.g. "240 KB". */
  size: string;
  /** Category used to pick an icon: "pdf" | "doc" | "image" | "archive" | "other". */
  type: "pdf" | "doc" | "image" | "archive" | "other";
  /** Unique key for React lists. */
  id: string;
}

// ─── Email Composer ───────────────────────────────────────────────────────────

/** Full public API surface exposed by useEmailComposer. */
export interface EmailComposerState {
  // Input
  jobDescription: string;
  wordCount: number;
  charCount: number;

  // Generated email fields
  subject: string;
  to: string;
  cc: string;
  bcc: string;
  emailHtml: string; // live HTML from the rich editor

  // Attachments
  attachments: AttachmentFile[];
  isDragging: boolean;

  // Loading / status
  isGenerating: boolean;
  isSending: boolean;

  // Handlers — JD input
  handleJobDescriptionChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  handleClearJobDescription: () => void;

  // Handlers — email fields
  handleSubjectChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleToChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCcChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBccChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEmailHtmlChange: (html: string) => void;

  // Handlers — attachments
  handleAddFiles: (files: FileList | File[]) => void;
  handleRemoveAttachment: (id: string) => void;
  handleDragEnter: () => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;

  // Actions
  handleGenerateMail: () => Promise<void>;
  handleCopy: () => void;
  handleSendEmail: () => Promise<void>;
}
