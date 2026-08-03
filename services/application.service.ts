import { api } from "@/lib/axios/client";
import {
  Application,
  ApplicationFilter,
  ApplicationResponse,
  ApplicationStats,
  ApplicationStatus,
  SyncResult,
} from "@/types/applications/type";

// ─── Helper: Build query string from filter ────────────────────────────────────

function buildParams(filters: ApplicationFilter): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  if (filters.search) params.search = filters.search;
  if (filters.status && filters.status !== "All") params.status = filters.status;
  if (filters.platform) params.platform = filters.platform;
  if (filters.appliedVia) params.appliedVia = filters.appliedVia;
  if (filters.labels?.length) params.labels = filters.labels.join(",");
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.sortBy) params.sortBy = filters.sortBy;
  if (filters.sortOrder) params.sortOrder = filters.sortOrder;

  return params;
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Fetch paginated + filtered applications for the current user.
 */
export async function getApplications(
  filters: ApplicationFilter = {},
): Promise<ApplicationResponse> {
  const params = buildParams(filters);
  const res = await api.get<ApplicationResponse>("/applications", { params });
  return res.data;
}

/**
 * Fetch a single application by ID.
 */
export async function getApplication(
  id: string,
): Promise<{ success: boolean; data: Application }> {
  const res = await api.get<{ success: boolean; data: Application }>(
    `/applications/${id}`,
  );
  return res.data;
}

/**
 * Trigger Gmail sync — fetches, AI-parses, and saves new job emails.
 */
export async function syncApplications(): Promise<SyncResult> {
  const res = await api.post<SyncResult>("/applications/sync", {});
  return res.data;
}

/**
 * Fetch dashboard statistics (counts by status + success rate).
 */
export async function getStats(): Promise<{
  success: boolean;
  data: ApplicationStats;
}> {
  const res = await api.get<{ success: boolean; data: ApplicationStats }>(
    "/applications/stats",
  );
  return res.data;
}

/**
 * Update editable fields of an application (notes, labels, platform, appliedVia).
 * Does NOT update status — use updateStatus() for that.
 */
export async function updateApplication(
  id: string,
  data: Partial<Pick<Application, "notes" | "labels" | "appliedVia" | "platform" | "companyLogo">>,
): Promise<{ success: boolean; data: Application }> {
  const res = await api.patch<{ success: boolean; data: Application }>(
    `/applications/${id}`,
    data,
  );
  return res.data;
}

/**
 * Update the status of an application.
 * Uses the dedicated /status sub-route for atomic status-only updates.
 */
export async function updateStatus(
  id: string,
  status: ApplicationStatus,
): Promise<{ success: boolean; data: Application }> {
  const res = await api.patch<{ success: boolean; data: Application }>(
    `/applications/${id}/status`,
    { status },
  );
  return res.data;
}

/**
 * Permanently delete an application.
 */
export async function deleteApplication(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(
    `/applications/${id}`,
  );
  return res.data;
}
