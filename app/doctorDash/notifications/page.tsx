"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, RefreshCw, CheckCircle2, Clock, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const PAGE_SIZE = 10;

export default function DoctorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/notifications/me");
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || t("doctorDashPages.notificationsPage.loadError", locale));
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
      setError(err instanceof Error ? err.message : t("doctorDashPages.notificationsPage.loadError", locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === "unread") return !n.read;
      if (filter === "read") return n.read;
      return true;
    });
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageNotifications = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const start = Math.max(1, Math.min(page - 2, totalPages - maxButtons + 1));
    const end = Math.min(totalPages, start + maxButtons - 1);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [page, totalPages]);

  const formatTime = (createdAt: string) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { 
        addSuffix: true, 
        locale: locale === "ar" ? ar : enUS 
      });
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
      console.error(err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await Promise.all(
        unread.map((n) =>
          fetch(`/api/notifications/${n.id}/read`, {
            method: "PATCH",
            credentials: "include",
          })
        )
      );
    } catch (err) {
      console.error(err);
    }
  }, [notifications]);

  return (
    <div className="space-y-6 text-start" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-(--text-primary)">
            {t("doctorDashPages.notificationsPage.title", locale)}
          </h1>
          <p className="text-sm text-(--text-secondary)">
            {t("doctorDashPages.notificationsPage.subtitle", locale)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadNotifications}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-(--card-border) bg-(--card-bg) hover:bg-(--semi-card-bg) text-sm font-semibold text-(--text-primary) cursor-pointer transition"
          >
            <RefreshCw size={16} />
            {t("doctorDashPages.notificationsPage.refresh", locale)}
          </button>
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-(--card-border) bg-(--card-bg) hover:bg-(--semi-card-bg) text-sm font-semibold text-(--text-primary) cursor-pointer transition"
          >
            <CheckCircle2 size={16} />
            {t("doctorDashPages.notificationsPage.markAllRead", locale)}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className={`rounded-2xl border border-(--card-border) bg-(--card-bg) p-4 flex flex-col gap-2 ${isRtl ? "items-start" : "items-start"}`}>
          <p className="text-sm text-(--text-secondary)">
            {t("doctorDashPages.notificationsPage.totalNotifications", locale)}
          </p>
          <div className="text-2xl font-bold text-(--text-primary)">
            {notifications.length}
          </div>
        </div>
        <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-4 flex flex-col gap-2">
          <p className="text-sm text-(--text-secondary)">
            {t("doctorDashPages.notificationsPage.unread", locale)}
          </p>
          <div className="text-2xl font-bold text-(--text-primary)">
            {unreadCount}
          </div>
        </div>
        <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-4 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-start">
            <p className="text-sm text-(--text-secondary)">
              {t("doctorDashPages.notificationsPage.lastActivity", locale)}
            </p>
            <div className="text-sm font-semibold text-(--text-primary) max-w-[180px] truncate">
              {notifications[0]?.title || t("doctorDashPages.notificationsPage.noRecentNotifications", locale)}
            </div>
          </div>
          <Bell size={24} className="text-(--text-secondary)" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 rounded-2xl bg-(--card-bg) p-1.5 border border-(--card-border) max-w-md">
        {([
          { key: "all", label: `${t("doctorDashPages.notificationsPage.filterAll", locale)} (${notifications.length})` },
          { key: "unread", label: `${t("doctorDashPages.notificationsPage.filterUnread", locale)} (${unreadCount})` },
          { key: "read", label: `${t("doctorDashPages.notificationsPage.filterRead", locale)} (${notifications.length - unreadCount})` },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilter(tab.key);
              setPage(1);
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
              filter === tab.key
                ? "bg-[#1f2b6c] text-white shadow-md font-medium"
                : "text-(--text-secondary) hover:bg-(--semi-card-bg)"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) overflow-hidden">
        <div className={`border-b border-(--card-border) px-6 py-4 flex items-center justify-between gap-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
          <h2 className="text-lg font-semibold text-(--text-primary)">
            {t("doctorDashPages.notificationsPage.allNotifications", locale)}
          </h2>
          <span className="text-sm text-(--text-secondary)">
            {t("doctorDashPages.notificationsPage.page", locale)} {page} {t("doctorDashPages.notificationsPage.of", locale)} {totalPages}
          </span>
        </div>

        {loading && (
          <div className="px-6 py-8 text-sm text-(--text-secondary) text-center">
            {t("doctorDashPages.notificationsPage.loadingNotifications", locale)}
          </div>
        )}

        {!loading && error && (
          <div className="px-6 py-8 text-sm text-red-500 text-center">{error}</div>
        )}

        {!loading && !error && pageNotifications.length === 0 && (
          <div className="px-6 py-8 text-sm text-(--text-secondary) text-center">
            {t("doctorDashPages.notificationsPage.noNotifications", locale)}
          </div>
        )}

        {!loading &&
          !error &&
          pageNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 px-6 py-4 border-b border-(--card-border) last:border-b-0 transition-colors ${
                notification.read ? "opacity-75 hover:bg-(--semi-card-bg)/30" : "bg-(--semi-card-bg) hover:bg-(--semi-card-bg)/80"
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src="/images/blank-profile-picture.png"
                  alt="Notification"
                  width={44}
                  height={44}
                  className="rounded-full object-cover"
                />
                {!notification.read && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#1f2b6c] rounded-full ring-2 ring-white dark:ring-slate-900" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-start">
                <div className={`flex items-center justify-between gap-4 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                  <h3 className="text-sm font-semibold text-(--text-primary) truncate">
                    {notification.title}
                  </h3>
                  <span className="text-xs text-(--text-secondary) whitespace-nowrap">
                    {formatTime(notification.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-(--text-secondary) leading-relaxed">
                  {notification.message}
                </p>
                {!notification.read && (
                  <button
                    onClick={() => markNotificationRead(notification.id)}
                    className={`mt-2 text-xs font-semibold text-[#1f2b6c] hover:underline flex items-center gap-1 cursor-pointer ${
                      isRtl ? "ml-auto" : "mr-auto"
                    }`}
                  >
                    <Check size={12} />
                    {t("doctorDashPages.notificationsPage.markAsRead", locale)}
                  </button>
                )}
              </div>
            </div>
          ))}

        {totalPages > 1 && (
          <div className={`flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-(--card-border) ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-(--card-border) text-sm font-semibold text-(--text-primary) disabled:opacity-50 cursor-pointer hover:bg-(--semi-card-bg) transition"
            >
              {t("doctorDashPages.notificationsPage.next", locale)}
            </button>
            <div className="flex items-center gap-2">
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border border-(--card-border) cursor-pointer transition ${
                    pageNumber === page
                      ? "bg-[#1f2b6c] text-white border-transparent shadow"
                      : "bg-(--card-bg) text-(--text-primary) hover:bg-(--semi-card-bg)"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-(--card-border) text-sm font-semibold text-(--text-primary) disabled:opacity-50 cursor-pointer hover:bg-(--semi-card-bg) transition"
            >
              {t("doctorDashPages.notificationsPage.previous", locale)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
