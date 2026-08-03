"use client";

import React, { useCallback } from "react";
import { AssistantHeader } from "./components/AssistantHeader";
import { QuickActionGrid } from "./components/QuickActionGrid";
import { ChatContainer } from "./components/ChatContainer";
import { SuggestedPromptChips } from "./components/SuggestedPromptChips";
import { ChatInput } from "./components/ChatInput";
import { RecentChats } from "./components/RecentChats";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { UsageCard } from "./components/UsageCard";
import { AITipsCard } from "./components/AITipsCard";
import { useAIChat } from "./hooks/useAIChat";
import type { AIToolKey } from "@/types/ai";

/**
 * AI Assistant page — composition root.
 *
 * Responsibilities:
 *  - Compose the useAIChat hook and pass data/handlers to child components.
 *  - Define the 3-panel responsive layout (main + right sidebar).
 *  - No business logic, no inline styling beyond layout tokens.
 */
const AIAssistantPage = () => {
  const chat = useAIChat();

  /**
   * Inject a prompt into chat, optionally with a specific AI tool.
   * Used by: QuickActionGrid, AssistantHeader examples, SuggestedPromptChips.
   */
  const handlePromptInject = useCallback(
    (prompt: string, tool?: AIToolKey) => {
      chat.sendMessage(prompt, tool);
    },
    [chat],
  );

  /** Select a conversation from the sidebar and load its messages. */
  const handleSelectConversation = useCallback(
    (id: string) => {
      chat.loadConversation(id);
    },
    [chat],
  );

  return (
    <div className="min-h-full bg-[#0a0a0a] p-5 lg:p-8">
      <div className="flex gap-6 items-start">
        {/* ── Main Content ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <AssistantHeader
            onNewChat={chat.clearChat}
            onPromptClick={(prompt) => handlePromptInject(prompt)}
          />

          {/* Quick Action Cards */}
          <QuickActionGrid onCTAClick={handlePromptInject} />

          {/* Chat Section */}
          <div className="space-y-3">
            {/* Section label */}
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-white">AI Chat</h2>
              <span className="h-px flex-1 bg-[#27272a]" />
              {chat.conversationId && (
                <span className="text-[10px] text-zinc-600 font-mono">
                  {chat.conversationId.slice(-8)}
                </span>
              )}
            </div>

            {/* Suggested prompt chips */}
            <SuggestedPromptChips onSelect={(prompt) => handlePromptInject(prompt)} />

            {/* Chat viewport */}
            <ChatContainer
              messages={chat.messages}
              isTyping={chat.isTyping}
              messagesEndRef={chat.messagesEndRef}
              onPromptClick={(prompt) => handlePromptInject(prompt)}
            />

            {/* Input bar */}
            <ChatInput
              value={chat.inputValue}
              isTyping={chat.isTyping}
              isStreaming={chat.isStreaming}
              onChange={chat.setInputValue}
              onSend={() => chat.sendMessage()}
              onAbort={chat.abortStream}
              onAttachmentAdd={chat.addAttachment}
              onAttachmentRemove={chat.removeAttachment}
              pendingAttachments={chat.pendingAttachments}
            />
          </div>
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col gap-4 w-[300px] shrink-0 sticky top-8">
          <RecentChats
            onSelectConversation={handleSelectConversation}
            activeConversationId={chat.conversationId}
          />
          <ActivityTimeline />
          <UsageCard />
          <AITipsCard />
        </aside>
      </div>
    </div>
  );
};

export default AIAssistantPage;
