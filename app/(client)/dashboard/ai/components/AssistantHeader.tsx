"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Plus, History } from "lucide-react";

interface AssistantHeaderProps {
  onNewChat: () => void;
  onPromptClick: (prompt: string) => void;
  onHistoryClick?: () => void;
}

const HEADER_EXAMPLES = [
  "Review my resume",
  "Prepare me for Amazon interview",
  "Analyze this job description",
  "Improve my cover letter",
];

/**
 * Page header for the AI Assistant page.
 * Shows the title, subtitle, decorative search input with examples,
 * and New Chat / Chat History action buttons.
 */
export function AssistantHeader({ onNewChat, onPromptClick, onHistoryClick }: AssistantHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Title + Subtitle */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-900/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              AI Career{" "}
              <span
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Assistant
              </span>
            </h1>
          </div>
          <p className="text-sm text-zinc-500 pl-0.5">
            Your personal AI career copilot — powered by LLaMA 3.3.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="ai-chat-history-btn"
            onClick={onHistoryClick}
            className="flex items-center gap-2 rounded-xl border border-[#27272a] bg-[#111111] px-3.5 py-2 text-[13px] font-medium text-zinc-400 transition-all duration-200 hover:border-[#3f3f46] hover:text-zinc-200"
          >
            <History className="h-4 w-4" />
            Chat History
          </button>
          <motion.button
            id="ai-new-chat-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewChat}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-lg shadow-purple-900/25 hover:from-indigo-500 hover:to-purple-500 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </motion.button>
        </div>
      </div>

      {/* Decorative search / example input */}
      <div className="relative rounded-2xl border border-[#27272a] bg-[#111111] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">
          Ask anything...
        </p>
        <div className="flex flex-wrap gap-2">
          {HEADER_EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onPromptClick(ex)}
              className="rounded-lg border border-[#27272a] bg-[#0f0f0f] px-3 py-1.5 text-[12px] text-zinc-400 transition-all duration-150 hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:text-indigo-300"
            >
              • {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
