"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, FileText, FileSearch, X, Loader2, Square } from "lucide-react";
import type { AIAttachment } from "@/types/ai";

interface ChatInputProps {
  value: string;
  isTyping: boolean;
  isStreaming?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onAbort?: () => void;
  onAttachmentAdd?: (attachment: AIAttachment) => void;
  onAttachmentRemove?: (fileId: string) => void;
  pendingAttachments?: AIAttachment[];
}

/**
 * Bottom chat input bar.
 * - Textarea with auto-resize.
 * - Real file upload for Resume and JD (via /api/upload).
 * - Attachment pills with remove button.
 * - Streaming abort button.
 */
export function ChatInput({
  value,
  isTyping,
  isStreaming = false,
  onChange,
  onSend,
  onAbort,
  onAttachmentAdd,
  onAttachmentRemove,
  pendingAttachments = [],
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"resume" | "jd" | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping && !isStreaming && value.trim()) onSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Auto-resize
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  // ─── File Upload ──────────────────────────────────────────────────────────

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    attachmentType: "resume" | "jd",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowed.includes(file.type)) {
      alert("Only PDF, DOCX, and TXT files are supported.");
      return;
    }

    setUploading(attachmentType);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("attachmentType", attachmentType);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      const json = await res.json();
      const attachment: AIAttachment = {
        fileId: json.data.public_id || json.data.fileId || file.name,
        url: json.data.secure_url || json.data.url || "",
        fileName: file.name,
        attachmentType,
        textContent: json.data.textContent || "",
        mimeType: file.type,
        size: file.size,
      };

      onAttachmentAdd?.(attachment);
    } catch (err) {
      console.error("[ChatInput] Upload error:", err);
      // Still add a local reference without upload for AI context
      const fallback: AIAttachment = {
        fileId: `local-${Date.now()}`,
        url: "",
        fileName: file.name,
        attachmentType,
        mimeType: file.type,
        size: file.size,
      };
      onAttachmentAdd?.(fallback);
    } finally {
      setUploading(null);
      // Reset input
      e.target.value = "";
    }
  };

  const canSend = !isTyping && !isStreaming && value.trim().length > 0;

  return (
    <div className="rounded-2xl border border-[#27272a] bg-[#111111] p-3 space-y-3">
      {/* Attachment pills */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pendingAttachments.map((att) => (
            <div
              key={att.fileId}
              className="flex items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#0f0f0f] px-2.5 py-1.5"
            >
              {att.attachmentType === "resume" ? (
                <FileText className="h-3 w-3 text-blue-400" />
              ) : (
                <FileSearch className="h-3 w-3 text-emerald-400" />
              )}
              <span className="text-[11px] text-zinc-400 max-w-[120px] truncate">
                {att.fileName}
              </span>
              <button
                onClick={() => onAttachmentRemove?.(att.fileId)}
                className="ml-1 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        id="ai-chat-input"
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={isStreaming ? "AI is responding…" : "Ask AI anything..."}
        disabled={isStreaming}
        className="w-full resize-none bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none leading-relaxed min-h-[40px] disabled:opacity-50"
      />

      {/* Action row */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Attach buttons */}
        <div className="flex items-center gap-1.5">
          {/* Hidden file inputs */}
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "resume")}
          />
          <input
            ref={jdInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "jd")}
          />

          <button
            id="attach-resume-btn"
            onClick={() => resumeInputRef.current?.click()}
            disabled={uploading !== null}
            className="flex items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#0f0f0f] px-2.5 py-1.5 text-[11px] font-medium text-zinc-500 transition-all duration-150 hover:border-[#3f3f46] hover:text-zinc-300 disabled:opacity-50"
          >
            {uploading === "resume" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            Attach Resume
          </button>

          <button
            id="attach-jd-btn"
            onClick={() => jdInputRef.current?.click()}
            disabled={uploading !== null}
            className="flex items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#0f0f0f] px-2.5 py-1.5 text-[11px] font-medium text-zinc-500 transition-all duration-150 hover:border-[#3f3f46] hover:text-zinc-300 disabled:opacity-50"
          >
            {uploading === "jd" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileSearch className="h-3.5 w-3.5" />
            )}
            Attach JD
          </button>

          <button
            id="attach-file-btn"
            aria-label="Attach file"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#27272a] bg-[#0f0f0f] text-zinc-600 transition-all duration-150 hover:border-[#3f3f46] hover:text-zinc-400"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right: Send / Stop button */}
        {isStreaming ? (
          <motion.button
            id="ai-stop-btn"
            whileTap={{ scale: 0.95 }}
            onClick={onAbort}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/30 transition-all duration-200"
          >
            <Square className="h-3 w-3 fill-current" />
            Stop
          </motion.button>
        ) : (
          <motion.button
            id="ai-send-btn"
            whileTap={{ scale: 0.95 }}
            disabled={!canSend}
            onClick={onSend}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all duration-200 ${
              canSend
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-purple-900/20"
                : "bg-[#1c1c1c] text-zinc-600 cursor-not-allowed"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </motion.button>
        )}
      </div>
    </div>
  );
}
