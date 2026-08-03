"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncApplications } from "@/services/application.service";
import { SyncResult } from "@/types/applications/type";

/**
 * React Query mutation hook for triggering a Gmail sync.
 *
 * On success:
 * - Invalidates the "applications" query → triggers a list refresh
 * - Invalidates the "applicationStats" query → refreshes stat cards
 */
export function useSyncApplications() {
  const queryClient = useQueryClient();

  return useMutation<SyncResult, Error>({
    mutationFn: syncApplications,
    onSuccess: () => {
      // Invalidate and refetch applications list + stats
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applicationStats"] });
    },
  });
}
