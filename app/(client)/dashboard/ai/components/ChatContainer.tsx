"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { EmptyConversation } from "./EmptyConversation";
import type { ChatMessage as ChatMessageType } from "../types";

interface ChatContainerProps {
  messages: ChatMessageType[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onPromptClick: (prompt: string) => void;
}

/** Number of messages that counts as "only the welcome message" → show empty state */
const WELCOME_ONLY_COUNT = 1;

/**
 * Scrollable chat area.
 * - Renders all messages via ChatMessage.
 * - Shows TypingIndicator while AI is "thinking".
 * - Shows EmptyConversation when only the welcome message exists.
 */
export function ChatContainer({
  messages,
  isTyping,
  messagesEndRef,
  onPromptClick,
}: ChatContainerProps) {
  const hasConversation = messages.length > WELCOME_ONLY_COUNT;

  return (
    <div className="rounded-2xl border border-[#27272a] bg-[#0d0d0d] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#27272a] px-5 py-3.5">
        <MessageSquare className="h-4 w-4 text-indigo-400" />
        <span className="text-[13px] font-semibold text-white">
          AI Conversation
        </span>
        {hasConversation && (
          <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 min-h-[320px] max-h-[480px]">
        {/* Always render messages (including welcome) */}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Empty state — only show when we only have the welcome message and no typing */}
        {!hasConversation && !isTyping && (
          <EmptyConversation onPromptClick={onPromptClick} />
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
