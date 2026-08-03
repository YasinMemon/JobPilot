"use client";

import { useQuery } from "@tanstack/react-query";
import type { SuggestedPrompt } from "@/services/prompt.service";

interface PromptsResponse {
  success: boolean;
  data: SuggestedPrompt[];
}

async function fetchPrompts(): Promise<SuggestedPrompt[]> {
  const res = await fetch("/api/ai/prompts");
  if (!res.ok) throw new Error("Failed to fetch prompts");
  const json: PromptsResponse = await res.json();
  return json.data || [];
}

export function useSuggestedPrompts() {
  return useQuery({
    queryKey: ["ai-prompts"],
    queryFn: fetchPrompts,
    staleTime: Infinity, // Prompts rarely change
    retry: 1,
  });
}
