"use client";

import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { deleteApplication } from "@/services/application.service";
import { ApplicationResponse } from "@/types/applications/type";

/**
 * React Query mutation hook for deleting an application.
 *
 * Features:
 * - Optimistic removal: immediately removes from all cached pages
 * - Rollback: restores the item if deletion fails
 * - Cache invalidation + stats refresh on settle
 */
export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string },
    Error,
    string, // mutationFn argument: the application ID
    { previousApplications: [QueryKey, unknown][] }
  >({
    mutationFn: (id: string) => deleteApplication(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["applications"] });

      // Snapshot all pages for rollback
      const previousApplications: [QueryKey, unknown][] = [];
      queryClient.getQueriesData<ApplicationResponse>({ queryKey: ["applications"] })
        .forEach(([queryKey, data]) => {
          if (data) previousApplications.push([queryKey, data]);
        });

      // Optimistically remove from every cached page
      queryClient.setQueriesData<ApplicationResponse>(
        { queryKey: ["applications"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((app) => app.id !== id),
            pagination: {
              ...old.pagination,
              total: Math.max(0, old.pagination.total - 1),
            },
          };
        },
      );

      // Remove single application cache
      queryClient.removeQueries({ queryKey: ["application", id] });

      return { previousApplications };
    },

    onError: (_err, _id, context) => {
      // Rollback
      if (context?.previousApplications) {
        context.previousApplications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applicationStats"] });
    },
  });
}
