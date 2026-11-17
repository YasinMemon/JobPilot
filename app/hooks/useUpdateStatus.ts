"use client";

import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { updateStatus } from "@/services/application.service";
import {
  Application,
  ApplicationResponse,
  ApplicationStatus,
} from "@/types/applications/type";

interface UpdateStatusVariables {
  id: string;
  status: ApplicationStatus;
}

/**
 * React Query mutation hook for updating an application's status.
 *
 * Features:
 * - Optimistic update: immediately updates the status in all cached
 *   "applications" queries before the server confirms
 * - Rollback: reverts to the previous state if the mutation fails
 * - Cache invalidation: refreshes applications + stats on success
 */
export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: Application },
    Error,
    UpdateStatusVariables,
    { previousApplications: [QueryKey, unknown][] } // snapshot for rollback
  >({
    mutationFn: ({ id, status }) => updateStatus(id, status),

    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches for applications
      await queryClient.cancelQueries({ queryKey: ["applications"] });

      // Snapshot all "applications" query states for potential rollback
      const previousApplications: [QueryKey, unknown][] = [];
      queryClient.getQueriesData<ApplicationResponse>({ queryKey: ["applications"] })
        .forEach(([queryKey, data]) => {
          if (data) {
            previousApplications.push([queryKey, data]);
          }
        });

      // Optimistically update every cached applications page
      queryClient.setQueriesData<ApplicationResponse>(
        { queryKey: ["applications"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((app) =>
              app.id === id ? { ...app, status } : app,
            ),
          };
        },
      );

      // Also update the single application cache if present
      queryClient.setQueryData<{ success: boolean; data: Application }>(
        ["application", id],
        (old) => {
          if (!old) return old;
          return { ...old, data: { ...old.data, status } };
        },
      );

      return { previousApplications };
    },

    onError: (_err, _variables, context) => {
      // Rollback all optimistic updates
      if (context?.previousApplications) {
        context.previousApplications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applicationStats"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
