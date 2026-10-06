"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Clock, Trash2, Pin } from "lucide-react";
import { useConversations } from "../hooks/useConversations";
import { useQueryClient } from "@tanstack/react-query";
import type { IConversation } from "@/types/ai";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ConversationSkeleton() {
  return (
    <div className="px-4 py-3 space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 bg-[#27272a] rounded w-3/4" />
          <div className="h-2.5 bg-[#1f1f1f] rounded w-full" />
          <div className="h-2 bg-[#1a1a1a] rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

// ─── Tag helpers ──────────────────────────────────────────────────────────────

function getConversationTag(conv: IConversation): { label: string; className: string } {
  const title = conv.title.toLowerCase();
  if (title.includes("interview"))
    return { label: "Interview", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
  if (title.includes("resume") || title.includes("ats") || title.includes("cv"))
    return { label: "Resume", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
  if (title.includes("roadmap") || title.includes("career"))
    return { label: "Roadmap", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  if (title.includes("cover") || title.includes("letter"))
    return { label: "Cover", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  if (title.includes("salary") || title.includes("market"))
    return { label: "Salary", className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
  return { label: "Chat", className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" };
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RecentChatsProps {
  onSelectConversation?: (id: string) => void;
  activeConversationId?: string | null;
}

export function RecentChats({ onSelectConversation, activeConversationId }: RecentChatsProps) {
  const { data: conversations, isLoading, error } = useConversations();
  const queryClient = useQueryClient();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/ai/conversation/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handlePin = async (e: React.MouseEvent, id: string, isPinned: boolean) => {
    e.stopPropagation();
    try {
      await fetch(`/api/ai/conversation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !isPinned }),
      });
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
    } catch (err) {
      console.error("Failed to pin conversation:", err);
    }
  };

  return (
    <div className="rounded-2xl border border-[#27272a] bg-[#111111] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#27272a] px-4 py-3.5 flex items-center gap-2">
        <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
        <span className="text-[12px] font-semibold text-white">Recent Chats</span>
        {conversations && (
          <span className="ml-auto rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-400 border border-indigo-500/20">
            {conversations.length}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <ConversationSkeleton />
      ) : error ? (
        <div className="px-4 py-6 text-center text-[11px] text-zinc-600">
          Failed to load chats
        </div>
      ) : !conversations || conversations.length === 0 ? (
        <div className="px-4 py-6 text-center text-[11px] text-zinc-600">
          No conversations yet. Start chatting!
        </div>
      ) : (
        <div className="divide-y divide-[#1a1a1a]">
          {conversations.map((conv: IConversation, i: number) => {
            const tag = getConversationTag(conv);
            const isActive = activeConversationId === conv._id;

            return (
              <motion.div
                key={conv._id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                onClick={() => onSelectConversation?.(conv._id)}
                onKeyDown={(e) => e.key === "Enter" && onSelectConversation?.(conv._id)}
                role="button"
                tabIndex={0}
                className={`group w-full text-left px-4 py-3 transition-all duration-150 hover:bg-[#161616] relative cursor-pointer ${
                  isActive ? "bg-[#161616] border-l-2 border-indigo-500" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[12px] font-medium text-zinc-300 truncate group-hover:text-white transition-colors flex items-center gap-1">
                    {conv.isPinned && <Pin className="h-2.5 w-2.5 text-amber-400 shrink-0" />}
                    {conv.title}
                  </span>
                  <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${tag.className}`}>
                    {tag.label}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed truncate mb-1.5">
                  {conv.lastMessage || "No messages yet"}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-700">
                    <Clock className="h-2.5 w-2.5" />
                    {formatRelativeTime(conv.updatedAt)}
                  </div>
                  {/* Actions visible on hover */}
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => handlePin(e, conv._id, conv.isPinned)}
                      className="p-1 rounded text-zinc-600 hover:text-amber-400 transition-colors"
                      title={conv.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin className="h-2.5 w-2.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, conv._id)}
                      className="p-1 rounded text-zinc-600 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
