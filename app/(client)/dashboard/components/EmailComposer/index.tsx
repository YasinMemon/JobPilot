"use client";

import { FileText, Loader2, Sparkles } from "lucide-react";
import type { EmailComposerState } from "../../types";

type EmailComposerProps = Pick<
  EmailComposerState,
  | "jobDescription"
  | "wordCount"
  | "charCount"
  | "isGenerating"
  | "handleJobDescriptionChange"
  | "handleClearJobDescription"
  | "handleGenerateMail"
>;

/**
 * Left panel of the email tool: job description input, word/char count,
 * clear button, and the "Generate Mail" trigger.
 *
 * Receives all state and handlers via props — no internal data fetching.
 */
export function EmailComposer({
  jobDescription,
  wordCount,
  charCount,
  isGenerating,
  handleJobDescriptionChange,
  handleClearJobDescription,
  handleGenerateMail,
}: EmailComposerProps) {
  return (
    <div className="rounded-2xl border border-[#27272a] bg-[#111111] p-5 flex flex-col gap-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <FileText className="h-4 w-4 text-zinc-500" />
          <h2 className="text-[14px] font-semibold text-white">
            Job Description
          </h2>
        </div>
        <p className="text-[11px] text-zinc-500">
          Paste any LinkedIn, Indeed or company job description.
        </p>
      </div>

      {/* Textarea */}
      <textarea
        className="w-full h-52 resize-none rounded-xl border border-[#27272a] bg-[#0f0f0f] px-4 py-3 text-[13px] text-zinc-300 placeholder:text-zinc-600 leading-relaxed transition-all duration-200 focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10"
        placeholder="paste job description here..."
        rows={10}
        value={jobDescription}
        onChange={handleJobDescriptionChange}
      />

      {/* Footer: word/char count + clear */}
      <div className="flex items-center justify-between text-[11px] text-zinc-600">
        <div className="flex items-center gap-2">
          <span>{wordCount} words</span>
          <span className="h-1 w-1 rounded-full bg-zinc-700" />
          <span>{charCount} chars</span>
        </div>
        {jobDescription && (
          <button
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            onClick={handleClearJobDescription}
          >
            Clear
          </button>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerateMail}
        disabled={!jobDescription.trim() || isGenerating}
        className={`group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl px-5 py-3 text-[14px] font-semibold text-white transition-all duration-300 ${jobDescription.trim() && !isGenerating
          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-purple-900/25 hover:scale-[1.01] active:scale-[0.99]"
          : isGenerating
            ? "bg-gradient-to-r from-blue-600/60 to-purple-600/60 cursor-not-allowed"
            : "bg-[#1c1c1c] text-zinc-600 cursor-not-allowed"
          }`}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
        )}
        {isGenerating ? "Generating..." : "Generate Mail"}
        <span className="absolute inset-0 -skew-x-12 bg-white/0 group-hover:bg-white/5 transition-all duration-500" />
      </button>
    </div>
  );
}
