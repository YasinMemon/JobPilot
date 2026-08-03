"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplication } from "@/services/application.service";
import { Application } from "@/types/applications/type";

/**
 * React Query hook for fetching a single application by ID.
 * Disabled when no ID is provided.
 */
export function useApplication(id: string | null) {
  return useQuery<{ success: boolean; data: Application }>({
    queryKey: ["application", id],
    queryFn: () => getApplication(id!),
    enabled: !!id,
  });
}
