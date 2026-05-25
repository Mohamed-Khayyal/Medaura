"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, RefreshCw, CheckCircle2 } from "lucide-react";
import type { Notification } from "@/lib/types/api";
import { fetchNotificationsClient } from "@/lib/utils/fetchNotifications";

const PAGE_SIZE = 10;

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchNotificationsClient();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch notifications");
      }
      const items = Array.isArray(result.data) ? result.data : [];
      const getTime = (value: string) => {
        const time = Date.parse(value);
        return Number.isNaN(time) ? 0 : time;
      };
      items.sort(
        (a: Notification, b: Notification) =>
          getTime(b.created_at) - getTime(a.created_at)
      );
      setNotifications(items);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch notifications";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageNotifications = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return notifications.slice(start, start + PAGE_SIZE);
  }, [notifications, page]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const start = Math.max(1, Math.min(page - 2, totalPages - maxButtons + 1));
    const end = Math.min(totalPages, start + maxButtons - 1);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [page, totalPages]);

  const formatTime = (createdAt: string) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const markNotificationRead = useCallback(async (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );

    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
    } catch (err) {
      // Best-effort; refresh will reconcile.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) {
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await Promise.all(
      unread.map((notification) =>
        fetch(`/api/notifications/${notification.id}/read`, {
          method: "PATCH",
          credentials: "include",
        })
      )
    );
  }, [notifications]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">Notifications</h1>
          <p className="text-sm text-(--text-secondary)">
            Stay on top of system updates and admin activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadNotifications}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-(--card-border) bg-(--card-bg) hover:bg-(--semi-card-bg) text-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-(--card-border) bg-(--card-bg) hover:bg-(--semi-card-bg) text-sm"
          >
            <CheckCircle2 size={16} />
            Mark all read
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-4">
          <p className="text-sm text-(--text-secondary)">Total notifications</p>
          <div className="mt-2 text-2xl font-semibold text-(--text-primary)">
            {notifications.length}
          </div>
        </div>
        <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-4">
          <p className="text-sm text-(--text-secondary)">Unread</p>
          <div className="mt-2 text-2xl font-semibold text-(--text-primary)">
            {unreadCount}
          </div>
        </div>
        <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-(--text-secondary)">Latest activity</p>
            <div className="mt-2 text-sm text-(--text-primary)">
              {notifications[0]?.title || "No recent updates"}
            </div>
          </div>
          <Bell size={24} className="text-(--text-secondary)" />
        </div>
      </div>

      <div className="rounded-2xl border border-(--card-border) bg-(--card-bg)">
        <div className="border-b border-(--card-border) px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-(--text-primary)">All notifications</h2>
          <span className="text-sm text-(--text-secondary)">
            Page {page} of {totalPages}
          </span>
        </div>

        {loading && (
          <div className="px-6 py-8 text-sm text-(--text-secondary)">Loading...</div>
        )}

        {!loading && error && (
          <div className="px-6 py-8 text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && pageNotifications.length === 0 && (
          <div className="px-6 py-8 text-sm text-(--text-secondary)">
            No notifications yet.
          </div>
        )}

        {!loading &&
          !error &&
          pageNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 px-6 py-4 border-b border-(--card-border) last:border-b-0 ${
                notification.read ? "opacity-70" : "bg-(--semi-card-bg)"
              }`}
            >
              <div className="relative">
                <img
                  src="/images/blank-profile-picture.png"
                  alt="Notification"
                  width={44}
                  height={44}
                  className="rounded-full"
                />
                {!notification.read && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-(--text-primary) truncate">
                    {notification.title}
                  </h3>
                  <span className="text-xs text-(--text-secondary) whitespace-nowrap">
                    {formatTime(notification.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-(--text-secondary)">
                  {notification.message}
                </p>
                {!notification.read && (
                  <button
                    onClick={() => markNotificationRead(notification.id)}
                    className="mt-2 text-xs text-indigo-600 hover:text-indigo-500"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}

        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-(--card-border)">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-(--card-border) text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                className={`px-3 py-1.5 rounded-lg text-sm border border-(--card-border) ${
                  pageNumber === page
                    ? "bg-(--primary) text-white border-transparent"
                    : "bg-(--card-bg)"
                }`}
              >
                {pageNumber}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-(--card-border) text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
