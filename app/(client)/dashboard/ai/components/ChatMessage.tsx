"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "../types";

interface ChatMessageProps {
  message: ChatMessageType;
}

/** Formats an ISO timestamp string to a short HH:MM display — locale-stable. */
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  } catch {
    return "";
  }
}

/**
 * Renders markdown-like text to React elements.
 * Supports: **bold**, bullet lines, blockquotes (>), headers (###)
 */
function renderContent(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    // Empty line → spacer
    if (!line.trim()) {
      return <div key={i} className="h-2" />;
    }

    // Header ### 
    if (line.startsWith("### ")) {
      const content = line.slice(4);
      return (
        <p key={i} className="text-[13px] font-bold text-white mt-2 mb-1 leading-tight">
          {renderInline(content)}
        </p>
      );
    }

    // Header ##
    if (line.startsWith("## ")) {
      const content = line.slice(3);
      return (
        <p key={i} className="text-[14px] font-bold text-white mt-3 mb-1 leading-tight">
          {renderInline(content)}
        </p>
      );
    }

    // Blockquote
    if (line.startsWith("> ")) {
      return (
        <div key={i} className="border-l-2 border-indigo-500/50 pl-3 my-1 text-zinc-400 italic text-[12px]">
          {renderInline(line.slice(2))}
        </div>
      );
    }

    // Bullet list items (•, -, *)
    if (/^[•\-\*]\s/.test(line)) {
      return (
        <div key={i} className="flex gap-2 leading-relaxed">
          <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
          <span>{renderInline(line.replace(/^[•\-\*]\s/, ""))}</span>
        </div>
      );
    }

    return (
      <div key={i} className="leading-relaxed">
        {renderInline(line)}
      </div>
    );
  });
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="text-white font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={j}>{part}</span>;
      })}
    </>
  );
}

// ─── Blinking Cursor ──────────────────────────────────────────────────────────

function StreamingCursor() {
  return (
    <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatMessage = React.memo(function ChatMessage({
  message,
}: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const isStreaming = message.isStreaming;
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [message.content, isStreaming]);

  if (isAssistant) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex items-end gap-3 mb-4"
      >
        {/* AI avatar */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-900/30">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>

        <div className="max-w-[80%] space-y-1" ref={contentRef}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-indigo-400">AI Assistant</span>
            {!isStreaming && (
              <span className="text-[10px] text-zinc-600">{formatTime(message.timestamp)}</span>
            )}
            {isStreaming && (
              <span className="text-[10px] text-indigo-500/60 animate-pulse">thinking…</span>
            )}
          </div>
          <div className="rounded-2xl rounded-bl-sm border border-[#27272a] bg-[#111111] px-4 py-3 text-[13px] text-zinc-300 shadow-lg leading-relaxed">
            {message.content ? (
              <>
                {renderContent(message.content)}
                {isStreaming && <StreamingCursor />}
              </>
            ) : (
              // Empty placeholder while streaming starts
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // User message
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-end justify-end gap-3 mb-4"
    >
      <div className="max-w-[80%] space-y-1">
        <div className="flex items-center justify-end gap-2 mb-1">
          <span className="text-[10px] text-zinc-600">{formatTime(message.timestamp)}</span>
          <span className="text-[11px] font-semibold text-zinc-400">You</span>
        </div>
        <div className="rounded-2xl rounded-br-sm bg-gradient-to-br from-indigo-600 to-purple-600 px-4 py-3 text-[13px] text-white shadow-lg shadow-purple-900/20 leading-relaxed">
          {message.content}
        </div>
      </div>

      {/* User avatar */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-[#3f3f46]">
        <User className="h-3.5 w-3.5 text-zinc-400" />
      </div>
    </motion.div>
  );
});
