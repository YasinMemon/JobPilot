"use client";

import { useState, useCallback } from "react";
import { generateEmail, sendEmailWithAttachments } from "../services/dashboard.service";
import {
  MAX_ATTACHMENT_FILES,
  MAX_TOTAL_SIZE_BYTES,
  ACCEPTED_MIME_TYPES,
} from "../constants";
import { toast } from "sonner";
import type { AttachmentFile, EmailComposerState } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractEmail(text: string): string {
  const match = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  return match ? match[0] : "";
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(file: File): AttachmentFile["type"] {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "doc";
  if (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp")
  )
    return "image";
  if (name.endsWith(".zip")) return "archive";
  return "other";
}

let _attachmentCounter = 0;
function generateId(): string {
  return `att_${Date.now()}_${++_attachmentCounter}`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Manages all state and handlers for the Gmail-style email composer:
 * JD input, AI generation (subject + HTML), To/CC/BCC/Subject fields,
 * file attachments, rich editor content, copy, and send.
 */
export function useEmailComposer(): EmailComposerState {
  // JD input
  const [jobDescription, setJobDescription] = useState("");

  // Generated email fields
  const [subject, setSubject] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [emailHtml, setEmailHtml] = useState("");

  // Attachments
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Loading
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // ── JD handlers ────────────────────────────────────────────────────────────

  const handleJobDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setJobDescription(value);
      // Auto-populate "To" from any email found in the JD
      const email = extractEmail(value);
      if (email) setTo(email);
    },
    [],
  );

  const handleClearJobDescription = useCallback(() => {
    setJobDescription("");
  }, []);

  // ── Email field handlers ────────────────────────────────────────────────────

  const handleSubjectChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value),
    [],
  );
  const handleToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value),
    [],
  );
  const handleCcChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setCc(e.target.value),
    [],
  );
  const handleBccChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setBcc(e.target.value),
    [],
  );
  const handleEmailHtmlChange = useCallback((html: string) => {
    setEmailHtml(html);
  }, []);

  // ── Attachment handlers ─────────────────────────────────────────────────────

  const handleAddFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Type validation
      const invalid = fileArray.filter((f) => !ACCEPTED_MIME_TYPES.has(f.type));
      if (invalid.length > 0) {
        toast.error(
          `Unsupported file type: ${invalid.map((f) => f.name).join(", ")}`,
        );
        return;
      }

      // Max files check
      const combined = [...attachments, ...fileArray];
      if (combined.length > MAX_ATTACHMENT_FILES) {
        toast.error(`You can attach a maximum of ${MAX_ATTACHMENT_FILES} files.`);
        return;
      }

      // Total size check
      const totalBytes = combined.reduce((sum, item) => {
        if (item instanceof File) return sum + item.size;
        const att = item as AttachmentFile;
        return sum + att.file.size;
      }, 0);
      if (totalBytes > MAX_TOTAL_SIZE_BYTES) {
        toast.error("Total attachment size exceeds 25 MB.");
        return;
      }

      const newAttachments: AttachmentFile[] = fileArray.map((file) => ({
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: getFileType(file),
        id: generateId(),
      }));

      setAttachments((prev) => [...prev, ...newAttachments]);
    },
    [attachments],
  );

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleDragEnter = useCallback(() => setIsDragging(true), []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleAddFiles(files);
      }
    },
    [handleAddFiles],
  );

  // ── Generate mail ───────────────────────────────────────────────────────────

  const handleGenerateMail = useCallback(async () => {
    if (isGenerating) return;
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description first.");
      return;
    }

    setIsGenerating(true);
    try {
      const hasResume = attachments.some(
        (a) => a.name.toLowerCase().includes("resume") || a.type === "pdf" || a.type === "doc",
      );
      const hasPortfolio = attachments.some((a) =>
        a.name.toLowerCase().includes("portfolio"),
      );

      const data = await generateEmail({ jd: jobDescription, hasResume, hasPortfolio });

      if (data.success) {
        setSubject(data.subject);
        setEmailHtml(data.html);
      } else {
        toast.error("Failed to generate email. Please try again.");
      }
    } catch {
      toast.error("An error occurred while generating the email.");
    } finally {
      setIsGenerating(false);
    }
  }, [jobDescription, attachments, isGenerating]);

  // ── Copy ────────────────────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    if (!emailHtml) return;
    // Strip HTML for clipboard plain text
    const plainText = emailHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    navigator.clipboard.writeText(plainText);
    toast.success("Email copied to clipboard.");
  }, [emailHtml]);

  // ── Send ────────────────────────────────────────────────────────────────────

  const handleSendEmail = useCallback(async () => {
    // Validation
    if (!to.trim()) {
      toast.error("Please enter the recipient's email address.");
      return;
    }
    if (!isValidEmail(to)) {
      toast.error("Please enter a valid recipient email address.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject line.");
      return;
    }
    const stripped = emailHtml.replace(/<[^>]+>/g, "").trim();
    if (!stripped) {
      toast.error("Email body cannot be empty.");
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("to", to.trim());
      if (cc.trim()) formData.append("cc", cc.trim());
      if (bcc.trim()) formData.append("bcc", bcc.trim());
      formData.append("subject", subject.trim());
      formData.append("html", emailHtml);

      for (const att of attachments) {
        formData.append("attachments[]", att.file, att.name);
      }

      const data = await sendEmailWithAttachments(formData);

      if (data.success) {
        toast.success("Email sent successfully!");
        // Reset composer state after successful send
        setSubject("");
        setTo("");
        setCc("");
        setBcc("");
        setEmailHtml("");
        setAttachments([]);
        setJobDescription("");
      } else {
        toast.error(data.message || "Failed to send email. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Error sending email:", error);
      toast.error("An error occurred while sending the email.");
    } finally {
      setIsSending(false);
    }
  }, [to, cc, bcc, subject, emailHtml, attachments]);

  // ── Return state ────────────────────────────────────────────────────────────

  return {
    jobDescription,
    wordCount: countWords(jobDescription),
    charCount: jobDescription.length,

    subject,
    to,
    cc,
    bcc,
    emailHtml,

    attachments,
    isDragging,

    isGenerating,
    isSending,

    handleJobDescriptionChange,
    handleClearJobDescription,

    handleSubjectChange,
    handleToChange,
    handleCcChange,
    handleBccChange,
    handleEmailHtmlChange,

    handleAddFiles,
    handleRemoveAttachment,
    handleDragEnter,
    handleDragLeave,
    handleDrop,

    handleGenerateMail,
    handleCopy,
    handleSendEmail,
  };
}
