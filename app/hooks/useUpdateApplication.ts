"use client";

import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { updateApplication } from "@/services/application.service";
import { Application, ApplicationResponse } from "@/types/applications/type";

interface UpdateApplicationVariables {
  id: string;
  data: Partial<Pick<Application, "notes" | "labels" | "appliedVia" | "platform" | "companyLogo" | "interviewAt">>;
}

/**
 * React Query mutation hook for updating application metadata
 * (notes, labels, platform, appliedVia).
 *
 * Includes optimistic updates + rollback on error.
 */
export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: Application },
    Error,
    UpdateApplicationVariables,
    { previousApplications: [QueryKey, unknown][] }
  >({
    mutationFn: ({ id, data }) => updateApplication(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["applications"] });

      const previousApplications: [QueryKey, unknown][] = [];
      queryClient.getQueriesData<ApplicationResponse>({ queryKey: ["applications"] })
        .forEach(([queryKey, queryData]) => {
          if (queryData) previousApplications.push([queryKey, queryData]);
        });

      // Optimistic update
      queryClient.setQueriesData<ApplicationResponse>(
        { queryKey: ["applications"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((app) =>
              app.id === id ? { ...app, ...data } : app,
            ),
          };
        },
      );

      return { previousApplications };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousApplications) {
        context.previousApplications.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
    },

    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
