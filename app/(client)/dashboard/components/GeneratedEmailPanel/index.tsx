"use client";

import { Copy, Loader2, MessageSquare, RefreshCw, Send, Wand2 } from "lucide-react";
import { EmptyEmailState } from "../EmptyEmailState";
import { EmailFieldRow } from "../EmailFieldRow";
import { RichEmailEditor } from "../RichEmailEditor";
import { AttachmentList } from "../AttachmentList";
import type { EmailComposerState } from "../../types";

type GeneratedEmailPanelProps = Pick<
  EmailComposerState,
  | "emailHtml"
  | "subject"
  | "to"
  | "cc"
  | "bcc"
  | "attachments"
  | "isDragging"
  | "isSending"
  | "isGenerating"
  | "handleSubjectChange"
  | "handleToChange"
  | "handleCcChange"
  | "handleBccChange"
  | "handleEmailHtmlChange"
  | "handleGenerateMail"
  | "handleCopy"
  | "handleSendEmail"
  | "handleAddFiles"
  | "handleRemoveAttachment"
  | "handleDragEnter"
  | "handleDragLeave"
  | "handleDrop"
>;

/**
 * Right panel — Gmail-style email compose window.
 *
 * Layout:
 *  1. Header (title + action buttons)
 *  2. Subject / To / CC / BCC fields
 *  3. Tiptap rich editor
 *  4. Attachment drop zone + file list
 *  5. Send footer
 */
export function GeneratedEmailPanel({
  emailHtml,
  subject,
  to,
  cc,
  bcc,
  attachments,
  isDragging,
  isSending,
  isGenerating,
  handleSubjectChange,
  handleToChange,
  handleCcChange,
  handleBccChange,
  handleEmailHtmlChange,
  handleGenerateMail,
  handleCopy,
  handleSendEmail,
  handleAddFiles,
  handleRemoveAttachment,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
}: GeneratedEmailPanelProps) {
  const hasContent = Boolean(emailHtml.replace(/<[^>]+>/g, "").trim());

  // Disable send if key fields are missing
  const isSendDisabled =
    isSending ||
    !to.trim() ||
    !subject.trim() ||
    !hasContent;

  return (
    <div className="rounded-2xl border border-[#27272a] bg-[#111111] flex flex-col h-full">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="border-b border-[#27272a] px-5 py-3.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-zinc-500" />
            <h2 className="text-[14px] font-semibold text-white">
              Generated Email
            </h2>
            {hasContent && (
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                Ready
              </span>
            )}
          </div>

          {/* Header action buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleCopy}
              disabled={!hasContent}
              title="Copy plain text to clipboard"
              className="flex items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#0f0f0f] px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 transition-all duration-200 hover:border-[#3f3f46] hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
            <button
              onClick={handleGenerateMail}
              disabled={isGenerating}
              title="Regenerate email with AI"
              className="flex items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#0f0f0f] px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 transition-all duration-200 hover:border-[#3f3f46] hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Regenerate
            </button>
            <button
              title="Improve email with AI (coming soon)"
              className="flex items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#0f0f0f] px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 transition-all duration-200 hover:border-[#3f3f46] hover:text-zinc-200"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Improve
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {hasContent ? (
          <>
            {/* ── Email header fields ─────────────────────────────────── */}
            <div className="border-b border-[#27272a] shrink-0">
              <EmailFieldRow
                id="email-subject"
                label="Subject"
                value={subject}
                onChange={handleSubjectChange}
                placeholder="Email subject…"
                required
              />
              <EmailFieldRow
                id="email-to"
                label="To"
                value={to}
                onChange={handleToChange}
                placeholder="recipient@company.com"
                type="email"
                required
              />
              <EmailFieldRow
                id="email-cc"
                label="CC"
                value={cc}
                onChange={handleCcChange}
                placeholder="cc@company.com (optional)"
                type="email"
              />
              <EmailFieldRow
                id="email-bcc"
                label="BCC"
                value={bcc}
                onChange={handleBccChange}
                placeholder="bcc@company.com (optional)"
                type="email"
              />
            </div>

            {/* ── Rich text editor ────────────────────────────────────── */}
            <div className="p-4 shrink-0">
              <RichEmailEditor
                initialContent={emailHtml}
                onChange={handleEmailHtmlChange}
              />
            </div>

            {/* ── Attachments ─────────────────────────────────────────── */}
            <div className="border-t border-[#27272a] px-4 py-4 shrink-0">
              <AttachmentList
                attachments={attachments}
                isDragging={isDragging}
                onAddFiles={handleAddFiles}
                onRemove={handleRemoveAttachment}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            </div>
          </>
        ) : (
          /* Empty state — shown before any email is generated */
          <div className="flex-1 flex flex-col">
            <EmptyEmailState />

            {/* Still show email fields and attachment zone in empty state */}
            <div className="border-t border-[#27272a] shrink-0">
              <EmailFieldRow
                id="email-subject-empty"
                label="Subject"
                value={subject}
                onChange={handleSubjectChange}
                placeholder="Email subject…"
              />
              <EmailFieldRow
                id="email-to-empty"
                label="To"
                value={to}
                onChange={handleToChange}
                placeholder="recipient@company.com"
                type="email"
              />
              <EmailFieldRow
                id="email-cc-empty"
                label="CC"
                value={cc}
                onChange={handleCcChange}
                placeholder="cc@company.com (optional)"
                type="email"
              />
              <EmailFieldRow
                id="email-bcc-empty"
                label="BCC"
                value={bcc}
                onChange={handleBccChange}
                placeholder="bcc@company.com (optional)"
                type="email"
              />
            </div>
            <div className="border-t border-[#27272a] px-4 py-4 shrink-0">
              <AttachmentList
                attachments={attachments}
                isDragging={isDragging}
                onAddFiles={handleAddFiles}
                onRemove={handleRemoveAttachment}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Send footer ──────────────────────────────────────────────────── */}
      <div className="border-t border-[#27272a] px-4 py-3 shrink-0">
        <button
          onClick={handleSendEmail}
          disabled={isSendDisabled}
          className={`group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl px-5 py-3 text-[14px] font-semibold text-white transition-all duration-300
            ${
              !isSendDisabled
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-purple-900/25 hover:scale-[1.005] active:scale-[0.99]"
                : "bg-[#1c1c1c] text-zinc-600 cursor-not-allowed"
            }
          `}
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              Send Email
              {attachments.length > 0 && (
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-normal">
                  {attachments.length} file{attachments.length !== 1 ? "s" : ""}
                </span>
              )}
            </>
          )}
          {/* Sheen animation */}
          {!isSendDisabled && (
            <span className="absolute inset-0 -skew-x-12 bg-white/0 group-hover:bg-white/5 transition-all duration-500" />
          )}
        </button>

        {/* Validation hints */}
        {!to.trim() && hasContent && (
          <p className="mt-1.5 text-center text-[10px] text-amber-500/70">
            Enter a recipient email to enable sending
          </p>
        )}
      </div>
    </div>
  );
}
