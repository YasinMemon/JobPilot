"use client";

import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  removeNotification,
} from "@/services/notification.client";
import type {
  Notification,
  NotificationListResponse,
} from "@/types/notifications/type";

/** Badge refresh interval. No websocket/SSE infrastructure exists, so poll. */
const UNREAD_POLL_MS = 60_000;

export const notificationKeys = {
  all: ["notifications"] as const,
  unread: ["notifications", "unread"] as const,
  list: (opts: { unreadOnly: boolean; limit: number }) =>
    ["notifications", "list", opts] as const,
};

type ListData = InfiniteData<NotificationListResponse, string | null>;

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Unread badge count. Polls only while the tab is visible
 * (`refetchIntervalInBackground` is false) and refreshes on window focus.
 */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery<number>({
    queryKey: notificationKeys.unread,
    queryFn: fetchUnreadCount,
    enabled,
    refetchInterval: UNREAD_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useNotificationList(opts: {
  unreadOnly?: boolean;
  limit?: number;
  enabled?: boolean;
}) {
  const unreadOnly = opts.unreadOnly ?? false;
  const limit = opts.limit ?? 20;

  return useInfiniteQuery<
    NotificationListResponse,
    Error,
    ListData,
    ReturnType<typeof notificationKeys.list>,
    string | null
  >({
    queryKey: notificationKeys.list({ unreadOnly, limit }),
    queryFn: ({ pageParam }) =>
      fetchNotifications({ limit, cursor: pageParam, unreadOnly }),
    initialPageParam: null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: opts.enabled ?? true,
    staleTime: 15_000,
  });
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

function patchLists(
  qc: QueryClient,
  fn: (items: Notification[], unreadOnly: boolean) => Notification[],
) {
  qc.setQueriesData<ListData>({ queryKey: ["notifications", "list"] }, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({ ...page, data: fn(page.data, false) })),
    };
  });
}

function snapshot(qc: QueryClient) {
  return {
    lists: qc.getQueriesData<ListData>({ queryKey: ["notifications", "list"] }),
    unread: qc.getQueryData<number>(notificationKeys.unread),
  };
}

function restore(qc: QueryClient, snap: ReturnType<typeof snapshot>) {
  snap.lists.forEach(([key, data]) => qc.setQueryData(key, data));
  qc.setQueryData(notificationKeys.unread, snap.unread);
}

// ─── Mutations (optimistic, with rollback) ────────────────────────────────────

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const snap = snapshot(qc);

      let wasUnread = false;
      snap.lists.forEach(([, data]) =>
        data?.pages.forEach((p) =>
          p.data.forEach((n) => {
            if (n.id === id && !n.isRead) wasUnread = true;
          }),
        ),
      );

      patchLists(qc, (items) =>
        items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      if (wasUnread) {
        qc.setQueryData<number>(notificationKeys.unread, (c) =>
          Math.max((c ?? 1) - 1, 0),
        );
      }
      return snap;
    },
    onError: (_e, _id, snap) => snap && restore(qc, snap),
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const snap = snapshot(qc);
      patchLists(qc, (items) => items.map((n) => ({ ...n, isRead: true })));
      qc.setQueryData<number>(notificationKeys.unread, 0);
      return snap;
    },
    onError: (_e, _v, snap) => snap && restore(qc, snap),
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeNotification(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const snap = snapshot(qc);

      let wasUnread = false;
      snap.lists.forEach(([, data]) =>
        data?.pages.forEach((p) =>
          p.data.forEach((n) => {
            if (n.id === id && !n.isRead) wasUnread = true;
          }),
        ),
      );

      patchLists(qc, (items) => items.filter((n) => n.id !== id));
      if (wasUnread) {
        qc.setQueryData<number>(notificationKeys.unread, (c) =>
          Math.max((c ?? 1) - 1, 0),
        );
      }
      return snap;
    },
    onError: (_e, _id, snap) => snap && restore(qc, snap),
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
