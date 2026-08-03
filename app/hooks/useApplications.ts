"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplications } from "@/services/application.service";
import { ApplicationFilter, ApplicationResponse } from "@/types/applications/type";

/**
 * React Query hook for fetching paginated + filtered applications.
 *
 * The query key includes the full filter object so React Query
 * automatically re-fetches when any filter changes.
 */
export function useApplications(filters: ApplicationFilter = {}) {
  return useQuery<ApplicationResponse>({
    queryKey: ["applications", filters],
    queryFn: () => getApplications(filters),
    placeholderData: (prev) => prev, // Keep previous data while fetching new page
  });
}
