"use client";

import { useQuery } from "@tanstack/react-query";
import type { IActivity } from "@/types/ai";

interface ActivitiesResponse {
  success: boolean;
  data: IActivity[];
}

async function fetchActivities(): Promise<IActivity[]> {
  const res = await fetch("/api/ai/activities?limit=8", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch activities");
  const json: ActivitiesResponse = await res.json();
  return json.data || [];
}

export function useActivities() {
  return useQuery({
    queryKey: ["ai-activities"],
    queryFn: fetchActivities,
    staleTime: 30_000,
    retry: 2,
  });
}
