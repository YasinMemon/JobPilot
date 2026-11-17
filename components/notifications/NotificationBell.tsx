"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Popover } from "radix-ui";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
  useUnreadNotificationCount,
} from "@/app/hooks/useNotifications";
import type { Notification } from "@/types/notifications/type";
import { NotificationItem } from "./NotificationItem";
import {
  NotificationEmpty,
  NotificationError,
  NotificationSkeleton,
} from "./NotificationStates";

const POPOVER_PAGE_SIZE = 8;

/**
 * Bell + unread badge + dropdown with the most recent notifications.
 *
 * Only the lightweight unread-count endpoint is polled while closed; the list
 * is fetched lazily the first time the dropdown opens.
 */
export default function NotificationBell({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: unread = 0 } = useUnreadNotificationCount();
  const list = useNotificationList({ limit: POPOVER_PAGE_SIZE, enabled: open });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  // Only the first page is shown in the dropdown; the full page has the rest.
  const items = list.data?.pages[0]?.data ?? [];
  const hasMore = list.data?.pages[0]?.hasMore ?? false;

  const handleOpen = useCallback(
    (n: Notification) => {
      if (!n.isRead) markRead.mutate(n.id);
      setOpen(false);
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

  const handleMarkAll = () =>
    markAll.mutate(undefined, {
      onError: () => toast.error("Couldn't mark notifications as read."),
    });

  const badge = unread > 99 ? "99+" : String(unread);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={
            unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
          }
          className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#27272a] bg-[#111111] text-zinc-400 transition-all duration-200 hover:border-[#3f3f46] hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 max-lg:h-11 max-lg:w-11 ${className}`}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#0f0f0f]"
            >
              {badge}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="dark z-[60] w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[#27272a] bg-[#0f0f10] shadow-2xl shadow-black/60 focus:outline-none"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#27272a] px-4 py-3">
            <h2 className="text-sm font-semibold text-white">
              Notifications
              {unread > 0 && (
                <span className="ml-2 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
                  {unread} new
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unread === 0 || markAll.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-[min(26rem,60vh)] overflow-y-auto overscroll-contain">
            {list.isPending ? (
              <NotificationSkeleton rows={3} />
            ) : list.isError ? (
              <NotificationError onRetry={() => list.refetch()} />
            ) : items.length === 0 ? (
              <NotificationEmpty />
            ) : (
              <ul>
                {items.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    compact
                    onOpen={handleOpen}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-[#27272a] p-2">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-center text-xs font-medium text-zinc-300 transition-colors hover:bg-[#18181b] hover:text-white"
            >
              {hasMore ? "View all notifications" : "Open notifications page"}
            </Link>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
