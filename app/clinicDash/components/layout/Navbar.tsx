"use client";

import { Bell, Search, LogOut, X, Menu, Globe } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  avatar: string;
};

type NotificationResponseItem = {
  id: number | string;
  title?: string;
  message?: string;
  created_at?: string;
  read?: boolean;
};

function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { logout, user, isAuthenticated } = useAuth();
  const locale = useLocale();
  const clinicName = (user?.profile?.name as string) || (locale === "ar" ? "عيادتي" : "My Clinic");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const avatarSrc =
    (typeof user?.photo === "string" && user.photo) ||
    (user?.profile?.photo as string) ||
    "/images/blank-profile-picture.png";
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const toggleLocale = () => {
    const next = locale === "en" ? "ar" : "en";
    try {
      localStorage.setItem("locale", next);
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("localeChange", { detail: next }));
    }
  };

  // Debounced URL update so page.tsx can read ?q= and filter
  const pushSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  useEffect(() => {
    const timer = setTimeout(() => pushSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, pushSearch]);

  // Fetch notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/notifications/list", { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setNotifications(
            res.data.map((n: NotificationResponseItem) => ({
              id: String(n.id),
              title: n.title || "",
              body: n.message || "",
              time: new Date(n.created_at || Date.now()).toLocaleTimeString(
                "ar-EG",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              ),
              read: n.read === true,
              avatar: "/images/blank-profile-picture.png",
            })),
          );
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

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
    };
    window.addEventListener("click", clickHandler);
    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("click", clickHandler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, []);

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="w-full sticky top-0 z-50 backdrop-blur-md bg-(--background)/80 border-b border-(--card-border)">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Hamburger (mobile) */}
            <div className="flex items-center gap-2 xl:hidden">
              <button
                type="button"
                onClick={onToggleSidebar}
                className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border border-(--card-border) bg-(--card-bg) text-(--foreground) hover:bg-(--hover-bg) transition"
              >
                <span className="sr-only">Open sidebar</span>
                <Menu size={18} />
              </button>
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 shrink-0">
                  <Image
                    src="/images/Logo1.png"
                    alt="Medaura logo"
                    fill
                    sizes="32px"
                    className="object-contain"
                  />
                </div>
                <span className="text-lg font-bold text-(--text-primary)">Medaura</span>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <input
                  id="clinic-nav-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("dashboard.header.searchPlaceholder", locale)}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  className="w-full pr-10 pl-4 py-2 rounded-2xl border border-(--input-border) bg-(--input-bg) text-sm text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
                <Search
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary)"
                />
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher */}
              <button
                onClick={toggleLocale}
                title={locale === "en" ? "Change to Arabic" : "تغيير إلى الإنجليزية"}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-2xl border border-(--card-border) bg-(--card-bg) hover:bg-(--semi-card-bg) transition cursor-pointer text-[13px] font-bold text-(--text-primary) gap-1"
              >
                <Globe size={16} />
                <span className="text-[11px] uppercase">{locale === "en" ? "ar" : "en"}</span>
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={notifOpen}
                  className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-2xl border border-(--card-border) bg-(--card-bg) hover:bg-(--semi-card-bg) transition cursor-pointer relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute mt-2 w-[300px] sm:w-80 max-w-[calc(100vw-2rem)] bg-(--card-bg) border border-(--card-border) rounded-2xl shadow-[var(--shadow-soft)] p-3 z-40 backdrop-blur-md" style={{[locale === 'ar' ? 'left' : 'right']: 0, position: 'absolute'}}>
                    <div className="flex items-center justify-between px-2 mb-2">
                      <h4 className="font-semibold text-(--text-primary) text-sm">
                        {t("dashboard.header.notifications", locale)}
                      </h4>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-teal-600 hover:text-teal-700"
                          >
                            {t("dashboard.header.markAllRead", locale)}
                          </button>
                        )}
                        <button
                          onClick={() => setNotifOpen(false)}
                          className="p-1 rounded hover:bg-(--hover-bg)"
                        >
                          <X size={14} className="text-(--text-secondary)" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-auto space-y-1">
                      {notifications.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-(--text-secondary) text-center">
                          {t("dashboard.header.noNotifications", locale)}
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setNotifications((prev) =>
                                prev.map((x) =>
                                  x.id === n.id ? { ...x, read: true } : x,
                                ),
                              );
                              setNotifOpen(false);
                            }}
                            className={`flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition hover:bg-(--hover-bg) ${
                              !n.read ? "bg-teal-50/60 dark:bg-teal-900/10" : ""
                            }`}
                          >
                            <img
                              src={n.avatar}
                              alt=""
                              width={36}
                              height={36}
                              className="rounded-full shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-(--text-primary) truncate">
                                {n.title}
                              </p>
                              <p className="text-xs text-(--text-secondary) truncate mt-0.5">
                                {n.body}
                              </p>
                            </div>
                            <span className="text-[10px] text-(--text-secondary) whitespace-nowrap mt-0.5">
                              {n.time}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-(--card-border) bg-(--card-bg) hover:bg-(--semi-card-bg) transition cursor-pointer"
                >
                  <img
                    src={avatarSrc}
                    alt={clinicName}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                  <span className="hidden sm:block text-sm font-medium text-(--text-primary) max-w-[120px] truncate">
                    {clinicName}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute mt-2 w-48 sm:w-52 bg-(--card-bg) border border-(--card-border) rounded-2xl shadow-[var(--shadow-soft)] p-2 z-50 backdrop-blur-sm" style={{[locale === 'ar' ? 'left' : 'right']: 0, position: 'absolute'}}>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <img
                        src={avatarSrc}
                        alt={clinicName}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-(--text-primary) truncate">
                          {clinicName}
                        </div>
                        <div className="text-xs text-teal-600 mt-0.5">
                          {t("dashboard.header.clinic", locale)}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-(--card-border) mt-1" />
                    <button
                      onClick={async () => {
                        await logout();
                        router.push("/login");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-red-600 hover:bg-(--hover-bg) rounded-xl transition text-sm"
                    >
                      <LogOut size={15} />
                      <span>{t("dashboard.header.signOut", locale)}</span>
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
