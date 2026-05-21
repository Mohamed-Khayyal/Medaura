"use client";

import { Sun, Moon, Bell, Search, LogOut, X, Menu } from "lucide-react";
import { useState, useRef, useEffect, useContext, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { DashboardThemeContext } from "../../../providers/DashboardThemeProvider";
import { useAuth } from "@/context/AuthContext";
import type { Notification } from "@/lib/types/api";

function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { darkMode, toggleTheme } = useContext(DashboardThemeContext);
  const { logout, user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const adminName = (user?.profile?.full_name as string) || "إسلام";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const avatarSrc =
    (typeof user?.photo === "string" && user.photo) ||
    (user?.profile?.photo as string) ||
    "/images/blank-profile-picture.png";
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const suggestions = [
    "محمد احمد",
    "د.احمد السيد",
    "Cardiology",
    "Orthopedics",
    "Oncology",
  ];

  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setProfileOpen(false);
      }
      if (
        e.key === "Enter" &&
        document.activeElement === document.getElementById("nav-search-input")
      ) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }
    };
    window.addEventListener("click", clickHandler);
    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("click", clickHandler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, [query, router]);

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const response = await fetch("/api/notifications/me", {
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
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
      const message = err instanceof Error ? err.message : "Failed to fetch notifications";
      setNotificationsError(message);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (notifOpen) {
      loadNotifications();
    }
  }, [notifOpen, loadNotifications]);

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
      // Best-effort; data will refresh on next open.
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatNotificationTime = (createdAt: string) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const toggleThemes = () => {
    // const next = !darkMode;
    toggleTheme();
  };
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleThemeChange = () => {
    setIsTransitioning(true);
    toggleTheme();

    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  };
  return (
    <>
      {isTransitioning && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-999 pointer-events-none transition-opacity duration-700" />
      )}
      <header className="w-full sticky top-0 z-50 backdrop-blur-md bg-(--background)/70  shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-(--card-border) bg-(--card-bg) text-(--foreground) hover:bg-gray-100 transition xl:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu size={18} />
            </button>

            <div className="flex-1">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                }}
                className="relative"
              >
                <input
                  id="nav-search-input"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(-1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveIndex((i) =>
                        Math.min(i + 1, suggestions.length - 1),
                      );
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveIndex((i) => Math.max(i - 1, 0));
                    }
                    if (e.key === "Enter" && activeIndex >= 0) {
                      e.preventDefault();
                      const s = suggestions[activeIndex];
                      router.push(`/search?q=${encodeURIComponent(s)}`);
                    }
                  }}
                  role="combobox"
                  aria-expanded={query.length > 0}
                  aria-controls="nav-search-list"
                  placeholder="Search patients, doctors, appointments..."
                  className="w-full pl-10 pr-4 py-3 rounded-full border border-(--input-border) bg-(--input-bg) dark:bg-slate-800 placeholder-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                {query.length > 0 && (
                  <ul
                    id="nav-search-list"
                    role="listbox"
                    className="absolute left-0 right-0 mt-2 bg-(--input-bg)  border border-(--input-border) rounded shadow z-40"
                  >
                    <li className="px-3 py-2 text-sm text-(--text-secondary)">
                      Search for "{query}"
                    </li>
                    {suggestions.map((s, idx) => (
                      <li
                        key={s}
                        role="option"
                        aria-selected={activeIndex === idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          router.push(`/search?q=${encodeURIComponent(s)}`);
                        }}
                        className={`px-3 py-2 hover:bg-(--semi-card-bg) dark:hover:bg-slate-800 cursor-pointer ${activeIndex === idx ? "bg-slate-100 dark:bg-slate-700" : ""}`}
                      >
                        {s}
                      </li>
                    ))}
                    <li className="px-3 py-2 text-xs text-slate-400">
                      Tip: use arrows and Enter
                    </li>
                  </ul>
                )}
              </form>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleThemeChange}
                title={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
                aria-pressed={darkMode}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-(--card-border) bg-(--card-bg) hover:bg-(--semi-card-bg) transition cursor-pointer"
              >
                <span className="sr-only">Toggle theme</span>
                <div className="relative w-4.5 h-4.5">
                  {/* Sun */}
                  <Sun
                    size={18}
                    className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] drop-shadow-[0_0_6px_rgba(255,255,255,0.3)] animate-spin [animation-duration:5s] opacity-80
                      ${
                        darkMode
                          ? "opacity-100 rotate-0 scale-100 "
                          : "opacity-0 rotate-90 scale-50 hidden"
                      }
                  `}
                  />

                  {/* Moon */}
                  <Moon
                    size={18}
                    className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] drop-shadow-[0_0_6px_rgba(255,255,255,0.3)] animate-bounce [animation-duration:.8s] opacity-80 
                      ${
                        darkMode
                          ? "opacity-0 -rotate-90 scale-50 hidden"
                          : "opacity-100 rotate-0 scale-100"
                      }
                  `}
                  />
                </div>
              </button>

              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={notifOpen}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-(--card-border)  bg-(--card-bg) hover:bg-(--semi-card-bg) transition cursor-pointer"
                >
                  <Bell size={18} />
                </button>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {notifOpen && (
                  <div className="absolute -left-2 mt-2 w-96  bg-(--card-bg) border border-(--card-border) rounded-2xl shadow-2xl p-3 z-40 backdrop-blur-md transform origin-top-left transition-all duration-150 ease-out">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="font-semibold">Notifications</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={markAllRead}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Mark all read
                        </button>
                        <button
                          onClick={() => setNotifOpen(false)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <X size={14} className="text-slate-500" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 max-h-64 overflow-auto">
                      {notificationsLoading && (
                        <div className="px-3 py-4 text-sm text-slate-500">
                          Loading notifications...
                        </div>
                      )}

                      {!notificationsLoading && notificationsError && (
                        <div className="px-3 py-4 text-sm text-red-500">
                          {notificationsError}
                        </div>
                      )}

                      {!notificationsLoading &&
                        !notificationsError &&
                        notifications.length === 0 && (
                          <div className="px-3 py-4 text-sm text-slate-500">
                            You're all caught up
                          </div>
                        )}

                      {!notificationsLoading &&
                        !notificationsError &&
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              setNotifOpen(false);
                            }}
                            className={`group flex items-start gap-3 px-3 py-2 rounded-xl cursor-pointer transition hover:shadow-md hover:-translate-y-0.5 ${
                              n.read
                                ? "bg-transparent opacity-70"
                                : "bg-linear-to-r from-indigo-50 to-white text-dark "
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
                              {!n.read && (
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">
                                  {n.title}
                                </p>
                                <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">
                                  {formatNotificationTime(n.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 truncate">
                                {n.message}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="mt-3 border-t pt-2 flex items-center justify-between px-2">
                      <button
                        onClick={loadNotifications}
                        className="text-xs text-slate-500"
                      >
                        Refresh
                      </button>
                      <button
                        onClick={() => {
                          router.push("/dashboard/notifications");
                          setNotifOpen(false);
                        }}
                        className="text-xs text-slate-500"
                      >
                        View all
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="relative flex items-center gap-3 bg-(--card-bg) border border-(--card-border) rounded-full px-3 py-1.5 cursor-pointer"
                ref={profileRef}
              >
                <div
                  className="text-right"
                  onClick={() => setProfileOpen((v) => !v)}
                >
                  <p className="text-sm font-medium text-(--text-primary)">
                    مرحباً {adminName}
                  </p>
                  <p className="text-xs text-(--text-secondary)">اَدمن</p>
                </div>
                <img
                  src={avatarSrc}
                  alt={adminName}
                  width={40}
                  height={40}
                  className="rounded-full"
                  onClick={() => setProfileOpen((v) => !v)}
                />
                {profileOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white/90 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 backdrop-blur-sm transform origin-top-left transition-all duration-150">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <img
                        src={avatarSrc}
                        alt={adminName}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-slate-800 dark:text-slate-100">
                          {adminName}
                        </div>
                        <div className="text-xs text-slate-400">Signed in</div>
                      </div>
                    </div>
                    <div className="border-t mt-1" />
                    <button
                      onClick={async () => {
                        await logout();
                        router.push("/login");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;
