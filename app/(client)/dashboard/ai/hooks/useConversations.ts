"use client";

import { useQuery } from "@tanstack/react-query";
import type { IConversation } from "@/types/ai";

interface ConversationsResponse {
  success: boolean;
  data: IConversation[];
}

async function fetchConversations(): Promise<IConversation[]> {
  const res = await fetch("/api/ai/conversations", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch conversations");
  const json: ConversationsResponse = await res.json();
  return json.data || [];
}

export function useConversations() {
  return useQuery({
    queryKey: ["ai-conversations"],
    queryFn: fetchConversations,
    staleTime: 30_000, // 30 seconds
    retry: 2,
  });
}
