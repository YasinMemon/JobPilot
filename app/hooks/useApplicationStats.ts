"use client";

import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/services/application.service";
import { ApplicationStats } from "@/types/applications/type";

/**
 * React Query hook for fetching application dashboard statistics.
 * Data is cached for 60 seconds (longer than the default 30s).
 */
export function useApplicationStats() {
  return useQuery<{ success: boolean; data: ApplicationStats }>({
    queryKey: ["applicationStats"],
    queryFn: getStats,
    staleTime: 60 * 1000, // 60 seconds — stats don't need to be as fresh
  });
}
