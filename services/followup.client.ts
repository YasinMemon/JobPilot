import { api } from "@/lib/axios/client";
import type {
  FollowUpSummary,
  SerializedTrackedEmail,
} from "@/types/followups/type";

/** Browser-side API client for the Smart Follow-ups endpoints. */

interface One {
  success: boolean;
  data: SerializedTrackedEmail;
}

export interface FollowUpListResponse {
  success: boolean;
  data: SerializedTrackedEmail[];
  summary: FollowUpSummary;
}

export interface DraftInput {
  to: string;
  subject: string;
  body: string;
}

export async function fetchFollowUps(
  params: { status?: string[]; applicationId?: string } = {},
): Promise<FollowUpListResponse> {
  const query: Record<string, string> = {};
  if (params.status?.length) query.status = params.status.join(",");
  if (params.applicationId) query.applicationId = params.applicationId;
  const res = await api.get<FollowUpListResponse>("/follow-ups", { params: query });
  return res.data;
}

export async function fetchFollowUp(id: string): Promise<SerializedTrackedEmail> {
  const res = await api.get<One>(`/follow-ups/${id}`);
  return res.data.data;
}

export async function generateFollowUpDraftRequest(id: string) {
  const res = await api.post<One>(`/follow-ups/${id}/draft`);
  return res.data.data;
}

export async function saveFollowUpDraft(id: string, input: DraftInput) {
  const res = await api.put<One>(`/follow-ups/${id}/draft`, input);
  return res.data.data;
}

/** Only ever called from the composer's explicit "Send Email" button. */
export async function sendFollowUp(id: string, input: DraftInput) {
  const res = await api.post<One>(`/follow-ups/${id}/send`, { ...input, confirm: true });
  return res.data.data;
}

export async function snoozeFollowUpRequest(
  id: string,
  input: { days?: number; until?: string },
) {
  const res = await api.post<One>(`/follow-ups/${id}/snooze`, input);
  return res.data.data;
}

export async function dismissFollowUpRequest(id: string) {
  const res = await api.post<One>(`/follow-ups/${id}/dismiss`);
  return res.data.data;
}

export async function checkFollowUpReply(id: string) {
  const res = await api.post<One & { replied: boolean }>(`/follow-ups/${id}/check-reply`);
  return res.data;
}

/** Pulls the server message out of an axios error for toasts. */
export function followUpErrorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || fallback;
}
