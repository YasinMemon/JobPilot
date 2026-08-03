"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AIToolKey, AIAttachment } from "@/types/ai";

// ─── Local message type (UI layer) ────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  toolUsed?: AIToolKey;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

export function makeWelcomeMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: `Hi there 👋

I'm your **AI Career Assistant** — powered by JobPilot.

I can help you:
• **Review resumes** and boost your ATS score
• **Prepare for interviews** with role-specific coaching
• **Analyze job descriptions** and identify skill gaps
• **Generate cover letters** tailored to any role
• **Write recruiter messages** that get replies
• **Build career roadmaps** to your dream job

How can I help you today?`,
    timestamp: nowISO(),
  };
}

// ─── Hook Return Type ─────────────────────────────────────────────────────────

export interface UseAIChatReturn {
  messages: ChatMessage[];
  inputValue: string;
  isTyping: boolean;
  isStreaming: boolean;
  conversationId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  setInputValue: (value: string) => void;
  sendMessage: (overrideContent?: string, tool?: AIToolKey) => Promise<void>;
  clearChat: () => void;
  abortStream: () => void;
  loadConversation: (id: string) => Promise<void>;
  pendingAttachments: AIAttachment[];
  addAttachment: (attachment: AIAttachment) => void;
  removeAttachment: (fileId: string) => void;
  clearAttachments: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Primary AI chat hook — handles real-time streaming from /api/ai/chat.
 *
 * Features:
 * - Token-by-token streaming via SSE
 * - Optimistic user message insertion
 * - Auto-scroll to latest message
 * - AbortController for cancel support
 * - Conversation persistence
 * - TanStack Query cache invalidation
 */
export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [makeWelcomeMessage()]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<AIAttachment[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null!);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ─── Load existing conversation ─────────────────────────────────────────────

  const loadConversation = useCallback(async (id: string) => {
    try {
      setIsTyping(true);
      const res = await fetch(`/api/ai/conversation/${id}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const json = await res.json();

      if (!json.success) throw new Error(json.message);

      const { messages: dbMessages } = json.data;

      const uiMessages: ChatMessage[] = dbMessages.map(
        (m: { _id: string; role: MessageRole; content: string; createdAt: string; toolUsed?: AIToolKey }) => ({
          id: m._id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
          toolUsed: m.toolUsed,
        }),
      );

      setMessages(uiMessages.length > 0 ? uiMessages : [makeWelcomeMessage()]);
      setConversationId(id);
    } catch (err) {
      console.error("[useAIChat] loadConversation error:", err);
    } finally {
      setIsTyping(false);
    }
  }, []);

  // ─── Send Message ───────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (overrideContent?: string, tool?: AIToolKey) => {
      const content = (overrideContent ?? inputValue).trim();
      if (!content) return;
      if (isStreaming) return;

      // 1. Optimistically add user message
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content,
        timestamp: nowISO(),
        toolUsed: tool,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setPendingAttachments([]);

      // 2. Show typing indicator
      setIsTyping(true);

      // 3. Prepare abort controller
      abortControllerRef.current = new AbortController();

      try {
        // 4. Call API
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            message: content,
            tool,
            attachments: pendingAttachments,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: "Request failed" }));
          throw new Error(err.message || "Chat request failed");
        }

        if (!res.body) throw new Error("No stream body");

        // 5. Begin streaming
        setIsTyping(false);
        setIsStreaming(true);

        // Create placeholder assistant message
        const assistantMsgId = generateId();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            timestamp: nowISO(),
            isStreaming: true,
            toolUsed: tool,
          },
        ]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let receivedConversationId: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const data = JSON.parse(raw);

              // Meta chunk — conversationId
              if (data.conversationId && !data.token && !data.done) {
                receivedConversationId = data.conversationId;
                setConversationId(data.conversationId);
              }

              // Token chunk
              if (data.token) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + data.token }
                      : m,
                  ),
                );
              }

              // Done signal
              if (data.done) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, isStreaming: false } : m,
                  ),
                );

                // Invalidate caches
                queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
                queryClient.invalidateQueries({ queryKey: ["ai-usage"] });
                queryClient.invalidateQueries({ queryKey: ["ai-activities"] });

                if (receivedConversationId) {
                  queryClient.invalidateQueries({
                    queryKey: ["ai-conversation", receivedConversationId],
                  });
                }
              }

              // Error from server
              if (data.error) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: "⚠️ " + data.error, isStreaming: false }
                      : m,
                  ),
                );
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User cancelled — clean up streaming placeholder
          setMessages((prev) =>
            prev.map((m) =>
              m.isStreaming ? { ...m, isStreaming: false, content: m.content || "[Cancelled]" } : m,
            ),
          );
        } else {
          console.error("[useAIChat] sendMessage error:", err);
          // Add error message
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              content: `⚠️ ${(err as Error).message || "Something went wrong. Please try again."}`,
              timestamp: nowISO(),
            },
          ]);
        }
      } finally {
        setIsTyping(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [inputValue, isStreaming, conversationId, pendingAttachments, queryClient],
  );

  // ─── Clear Chat ─────────────────────────────────────────────────────────────

  const clearChat = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([makeWelcomeMessage()]);
    setInputValue("");
    setIsTyping(false);
    setIsStreaming(false);
    setConversationId(null);
    setPendingAttachments([]);
  }, []);

  // ─── Abort ──────────────────────────────────────────────────────────────────

  const abortStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // ─── Attachments ────────────────────────────────────────────────────────────

  const addAttachment = useCallback((attachment: AIAttachment) => {
    setPendingAttachments((prev) => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((fileId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.fileId !== fileId));
  }, []);

  const clearAttachments = useCallback(() => {
    setPendingAttachments([]);
  }, []);

  return {
    messages,
    inputValue,
    isTyping,
    isStreaming,
    conversationId,
    messagesEndRef,
    setInputValue,
    sendMessage,
    clearChat,
    abortStream,
    loadConversation,
    pendingAttachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
  };
}
