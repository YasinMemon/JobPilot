"use client";

import React, { useRef } from "react";
import {
  FileText,
  FileImage,
  Archive,
  File,
  X,
  Paperclip,
  Upload,
} from "lucide-react";
import type { AttachmentFile } from "../types";
import { ATTACHMENT_ACCEPT } from "../constants";

// ─── File icon helper ─────────────────────────────────────────────────────────

function AttachmentIcon({ type }: { type: AttachmentFile["type"] }) {
  switch (type) {
    case "pdf":
      return <FileText className="h-4 w-4 text-rose-400 shrink-0" />;
    case "doc":
      return <FileText className="h-4 w-4 text-blue-400 shrink-0" />;
    case "image":
      return <FileImage className="h-4 w-4 text-emerald-400 shrink-0" />;
    case "archive":
      return <Archive className="h-4 w-4 text-amber-400 shrink-0" />;
    default:
      return <File className="h-4 w-4 text-zinc-400 shrink-0" />;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AttachmentListProps {
  attachments: AttachmentFile[];
  isDragging: boolean;
  onAddFiles: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * Attachment section for the email composer.
 * - Shows a drag-and-drop zone (always visible).
 * - Lists attached files with icon, name, size, and remove button.
 * - Hidden file input triggered by the "Attach Files" button.
 */
export function AttachmentList({
  attachments,
  isDragging,
  onAddFiles,
  onRemove,
  onDragEnter,
  onDragLeave,
  onDrop,
}: AttachmentListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAddFiles(files);
    }
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Paperclip className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
          Attachments
        </span>
        {attachments.length > 0 && (
          <span className="rounded-full border border-[#27272a] bg-[#1c1c1c] px-1.5 py-0.5 text-[9px] text-zinc-500">
            {attachments.length}
          </span>
        )}
      </div>

      {/* Drag-and-drop zone */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          onDragEnter();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-center transition-all duration-200 cursor-pointer
          ${
            isDragging
              ? "border-blue-500/50 bg-blue-500/5"
              : "border-[#27272a] bg-[#0a0a0a] hover:border-[#3f3f46] hover:bg-white/[0.01]"
          }
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors duration-200 ${
            isDragging
              ? "border-blue-500/30 bg-blue-500/10"
              : "border-[#27272a] bg-[#161616]"
          }`}
        >
          <Upload
            className={`h-4 w-4 transition-colors duration-200 ${
              isDragging ? "text-blue-400" : "text-zinc-500"
            }`}
          />
        </div>
        <div>
          <p className="text-[11px] font-medium text-zinc-400">
            Drag &amp; drop files here, or{" "}
            <span className="text-blue-400">browse</span>
          </p>
          <p className="text-[10px] text-zinc-600 mt-0.5">
            PDF, DOC, DOCX, JPG, PNG, ZIP · max 10 files · 25 MB total
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT}
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Attach files"
        />
      </div>

      {/* Attached file list */}
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group flex items-center justify-between rounded-lg border border-[#27272a] bg-[#111111] px-3 py-2 transition-colors hover:border-[#3f3f46]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AttachmentIcon type={att.type} />
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-zinc-300 truncate">
                    {att.name}
                  </p>
                  <p className="text-[10px] text-zinc-600">{att.size}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemove(att.id)}
                title={`Remove ${att.name}`}
                className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-150"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
