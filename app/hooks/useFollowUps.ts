"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkFollowUpReply,
  dismissFollowUpRequest,
  fetchFollowUp,
  fetchFollowUps,
  generateFollowUpDraftRequest,
  saveFollowUpDraft,
  sendFollowUp,
  snoozeFollowUpRequest,
  type DraftInput,
} from "@/services/followup.client";
import { notificationKeys } from "@/app/hooks/useNotifications";

export const followUpKeys = {
  all: ["follow-ups"] as const,
  list: (status: string[] = []) => ["follow-ups", "list", status] as const,
  detail: (id: string) => ["follow-ups", "detail", id] as const,
};

export function useFollowUps(status: string[] = []) {
  return useQuery({
    queryKey: followUpKeys.list(status),
    queryFn: () => fetchFollowUps({ status }),
    staleTime: 15_000,
  });
}

export function useFollowUp(id: string | null) {
  return useQuery({
    queryKey: followUpKeys.detail(id ?? ""),
    queryFn: () => fetchFollowUp(id as string),
    enabled: Boolean(id),
  });
}

/** Any follow-up change can also change notifications (read / removed). */
function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: followUpKeys.all });
    qc.invalidateQueries({ queryKey: notificationKeys.all });
  };
}

export function useGenerateDraft() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => generateFollowUpDraftRequest(id),
    onSettled: refresh,
  });
}

export function useSaveDraft() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & DraftInput) =>
      saveFollowUpDraft(id, input),
    onSettled: refresh,
  });
}

export function useSendFollowUp() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & DraftInput) => sendFollowUp(id, input),
    onSettled: refresh,
  });
}

export function useSnoozeFollowUp() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; days?: number; until?: string }) =>
      snoozeFollowUpRequest(id, input),
    onSettled: refresh,
  });
}

export function useDismissFollowUp() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => dismissFollowUpRequest(id),
    onSettled: refresh,
  });
}

export function useCheckReply() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => checkFollowUpReply(id),
    onSettled: refresh,
  });
}

/** Tracked emails (and their follow-ups) for one application. */
export function useApplicationFollowUps(applicationId: string | null) {
  return useQuery({
    queryKey: ["follow-ups", "application", applicationId ?? ""],
    queryFn: () => fetchFollowUps({ applicationId: applicationId as string }),
    enabled: Boolean(applicationId),
    staleTime: 15_000,
  });
}
