import { api } from "@/lib/axios/client";
import type {
  NotificationListParams,
  NotificationListResponse,
} from "@/types/notifications/type";

/** Browser-side API client for the notification endpoints. */

export async function fetchNotifications(
  params: NotificationListParams = {},
): Promise<NotificationListResponse> {
  const query: Record<string, string> = {};
  if (params.limit) query.limit = String(params.limit);
  if (params.cursor) query.cursor = params.cursor;
  if (params.unreadOnly) query.unreadOnly = "true";

  const res = await api.get<NotificationListResponse>("/notifications", {
    params: query,
  });
  return res.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await api.get<{ success: boolean; count: number }>(
    "/notifications/unread-count",
  );
  return res.data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all");
}

export async function removeNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
