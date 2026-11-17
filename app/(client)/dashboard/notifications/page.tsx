"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
  useUnreadNotificationCount,
} from "@/app/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import {
  NotificationEmpty,
  NotificationError,
  NotificationSkeleton,
} from "@/components/notifications/NotificationStates";
import type { Notification } from "@/types/notifications/type";

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const unreadOnly = filter === "unread";

  const { data: unread = 0 } = useUnreadNotificationCount();
  const list = useNotificationList({ unreadOnly, limit: 20 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const items = useMemo(
    () => list.data?.pages.flatMap((p) => p.data) ?? [],
    [list.data],
  );

  const handleOpen = useCallback(
    (n: Notification) => {
      if (!n.isRead) markRead.mutate(n.id);
      if (n.link) router.push(n.link);
    },
    [markRead, router],
  );

  const handleDelete = useCallback(
    (n: Notification) =>
      remove.mutate(n.id, {
        onError: () => toast.error("Couldn't delete the notification."),
      }),
    [remove],
  );

  return (
    <div className="mx-auto min-h-full w-full max-w-3xl space-y-5 bg-[#0a0a0a] p-4 sm:p-5 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {unread > 0
              ? `You have ${unread} unread notification${unread === 1 ? "" : "s"}.`
              : "You're all caught up."}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            markAll.mutate(undefined, {
              onError: () => toast.error("Couldn't mark notifications as read."),
            })
          }
          disabled={unread === 0 || markAll.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#27272a] bg-[#111111] px-3.5 text-xs font-medium text-zinc-200 transition-colors hover:border-[#3f3f46] hover:text-white disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:border-[#27272a]"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Filter notifications"
        className="inline-flex rounded-xl border border-[#27272a] bg-[#111111] p-1"
      >
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`h-8 rounded-lg px-4 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "bg-[#1f1f23] text-white"
                : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {f}
            {f === "unread" && unread > 0 ? ` (${unread})` : ""}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#27272a] bg-[#0f0f10]">
        {list.isPending ? (
          <NotificationSkeleton rows={6} />
        ) : list.isError ? (
          <NotificationError onRetry={() => list.refetch()} />
        ) : items.length === 0 ? (
          <NotificationEmpty unreadOnly={unreadOnly} />
        ) : (
          <>
            <ul>
              {items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onOpen={handleOpen}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
            {list.hasNextPage && (
              <div className="border-t border-[#27272a] p-3 text-center">
                <button
                  type="button"
                  onClick={() => list.fetchNextPage()}
                  disabled={list.isFetchingNextPage}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#27272a] bg-[#111111] px-5 text-xs font-medium text-zinc-200 transition-colors hover:border-[#3f3f46] hover:text-white disabled:opacity-60"
                >
                  {list.isFetchingNextPage && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {list.isFetchingNextPage ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
