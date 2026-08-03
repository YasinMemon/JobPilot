"use client";

import React from "react";
import { useSuggestedPrompts } from "../hooks/useSuggestedPrompts";
import { SUGGESTED_PROMPTS } from "../constants";

interface SuggestedPromptChipsProps {
  onSelect: (prompt: string) => void;
}

/**
 * A horizontal scrollable row of clickable pill chips for common prompts.
 * Loads from /api/ai/prompts with fallback to static constants.
 */
export function SuggestedPromptChips({ onSelect }: SuggestedPromptChipsProps) {
  const { data: apiPrompts, isLoading } = useSuggestedPrompts();

  // Use API prompts if available, fallback to static
  const prompts = apiPrompts?.map((p) => p.prompt) ?? (isLoading ? [] : SUGGESTED_PROMPTS);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="shrink-0 h-7 w-28 animate-pulse rounded-xl bg-[#1c1c1c]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          id={`suggested-prompt-${prompt.replace(/\s+/g, "-").toLowerCase()}`}
          onClick={() => onSelect(prompt)}
          className="shrink-0 rounded-xl border border-[#27272a] bg-[#111111] px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition-all duration-150 hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:text-indigo-300 whitespace-nowrap"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
