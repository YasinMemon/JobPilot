"use client";

import { useQuery } from "@tanstack/react-query";
import type { UsageSummary } from "@/types/ai";

interface UsageResponse {
  success: boolean;
  data: UsageSummary;
}

async function fetchUsage(): Promise<UsageSummary> {
  const res = await fetch("/api/ai/usage", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch usage");
  const json: UsageResponse = await res.json();
  return (
    json.data || {
      creditsUsed: 0,
      creditsTotal: 100,
      messages: 0,
      tokensUsed: 0,
      creditsRemaining: 100,
      percentUsed: 0,
      resetAt: new Date().toISOString(),
    }
  );
}

export function useUsage() {
  return useQuery({
    queryKey: ["ai-usage"],
    queryFn: fetchUsage,
    staleTime: 60_000, // 1 minute
    retry: 2,
  });
}
