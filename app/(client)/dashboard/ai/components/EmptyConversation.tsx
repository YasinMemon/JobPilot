"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";

interface EmptyConversationProps {
  onPromptClick: (prompt: string) => void;
}

const EMPTY_PROMPTS = [
  "Review my Resume",
  "Prepare Interview Questions",
  "Analyze Job Description",
  "Create Career Roadmap",
];

/**
 * Empty state shown when there are no chat messages yet (beyond welcome).
 * Displays a glowing AI icon and quick-start prompts.
 */
export function EmptyConversation({ onPromptClick }: EmptyConversationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {/* Glowing icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20">
          <Bot className="h-9 w-9 text-indigo-400" />
          <span className="absolute -top-1 -right-1">
            <Sparkles className="h-4 w-4 text-purple-400" />
          </span>
        </div>
      </div>

      <h3 className="text-[15px] font-semibold text-white mb-2">
        Start your first AI conversation
      </h3>
      <p className="text-[13px] text-zinc-500 max-w-xs mb-8 leading-relaxed">
        Choose one of the tools above or simply ask a question below.
      </p>

      {/* Quick start chips */}
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {EMPTY_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onPromptClick(p)}
            className="rounded-xl border border-[#27272a] bg-[#111111] px-3.5 py-2 text-[12px] font-medium text-zinc-400 transition-all duration-150 hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:text-indigo-300"
          >
            {p}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
