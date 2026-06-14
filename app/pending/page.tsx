"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";
import { Globe } from "lucide-react";
import Image from "next/image";

export default function PendingApprovalPage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (loading) return;

    // Not logged in → go to login
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const role = user?.user_type?.toLowerCase();
    const profile = user?.profile as Record<string, unknown> | undefined;

    // If user is not one of the pending roles, send them to their dashboard
    if (role !== "staff" && role !== "doctor" && role !== "clinic") {
      router.replace("/");
      return;
    }

    // Staff/Doctor: check verified fields
    const isVerified = profile?.is_verified === true || profile?.verified === true;

    if ((role === "staff" || role === "doctor") && isVerified) {
      router.replace("/doctorDash");
      return;
    }

    // Clinic: check status field
    if (role === "clinic") {
      const status = profile?.status as string | undefined;
      if (status === "active" || status === "approved" || isVerified) {
        router.replace("/clinicDash");
        return;
      }
    }
  }, [loading, isAuthenticated, user, router]);

  const toggleLocale = () => {
    const next = locale === "en" ? "ar" : "en";
    try {
      localStorage.setItem("locale", next);
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("localeChange", { detail: next }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f4f8]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d9e3ff] border-t-indigo-700" />
      </div>
    );
  }

  const role = user?.user_type?.toLowerCase();
  const config = getConfig(role, locale);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f5f7ff] to-[#e8f4ff] flex items-center justify-center p-4 relative" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Language Switcher */}
      <div className={`absolute top-4 ${locale === "ar" ? "left-4" : "right-4"} z-50`}>
        <button
          type="button"
          onClick={toggleLocale}
          className="inline-flex h-10 px-4 items-center gap-2 rounded-2xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition shadow-sm cursor-pointer"
          title={locale === "en" ? "Change to Arabic" : "تغيير إلى الإنجليزية"}
        >
          <Globe size={14} className="text-zinc-500" />
          <span className="uppercase">{locale === "en" ? "ar" : "en"}</span>
        </button>
      </div>

      {/* Decorative background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-sky-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Card */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/60 p-8 sm:p-12 text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10 shrink-0">
                <Image
                  src="/images/Logo1.png"
                  alt="Medaura logo"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-wide text-indigo-900">Medaura</span>
            </div>
          </div>

          {/* Animated Icon */}
          <div className="mb-6 flex justify-center">
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: config.iconBg }}
            >
              {config.icon}
            </div>
          </div>

          {/* Pulsing indicator */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
              style={{ background: config.badgeBg, color: config.badgeColor }}>
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ background: config.badgeColor }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ background: config.badgeColor }}
                />
              </span>
              {config.badge}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0f1a4f] mb-3">
            {config.title}
          </h1>

          {/* Subtitle */}
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8">
            {config.subtitle}
          </p>

          {/* Info box */}
          <div
            className={`rounded-2xl p-4 mb-8 text-sm leading-relaxed ${locale === "ar" ? "text-right" : "text-left"}`}
            style={{ background: config.infoBg, color: config.infoColor }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p>{config.infoText}</p>
            </div>
          </div>

          {/* Steps */}
          <div className="mb-8 space-y-3">
            {config.steps.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 ${locale === "ar" ? "text-right" : "text-left"}`}>
                <div
                  className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: config.stepBg, color: config.stepColor }}
                >
                  {i + 1}
                </div>
                <span className="text-sm text-gray-600">{step}</span>
              </div>
            ))}
          </div>

          {/* Action buttons (Complete Profile / Complete Data) */}
          <div className="mb-3 w-full flex flex-col gap-2">
            {getProfileButtons(role, locale, router)}
          </div>

          {/* Logout button */}
          <button
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 cursor-pointer"
          >
            {t("pendingPage.logout", locale)}
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-gray-400">
          {t("pendingPage.footerNote", locale)}
        </p>
      </div>
    </div>
  );
}

/* ─── per-role config ────────────────────────────────────────────────── */

type RoleConfig = {
  icon: React.ReactNode;
  iconBg: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  infoBg: string;
  infoColor: string;
  infoText: string;
  steps: string[];
  stepBg: string;
  stepColor: string;
};

function getIconForRole(role: string) {
  switch (role) {
    case "staff":
      return (
        <svg className="h-12 w-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "doctor":
      return (
        <svg className="h-12 w-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case "clinic":
      return (
        <svg className="h-12 w-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    default:
      return (
        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getIconBgForRole(role: string) {
  switch (role) {
    case "staff":
      return "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";
    case "doctor":
      return "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)";
    case "clinic":
      return "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)";
    default:
      return "#f3f4f6";
  }
}

function getBadgeBgForRole(role: string) {
  switch (role) {
    case "staff":
      return "#fef9ec";
    case "doctor":
      return "#eef2ff";
    case "clinic":
      return "#f0fdfa";
    default:
      return "#f9fafb";
  }
}

function getBadgeColorForRole(role: string) {
  switch (role) {
    case "staff":
      return "#d97706";
    case "doctor":
      return "#4338ca";
    case "clinic":
      return "#0f766e";
    default:
      return "#6b7280";
  }
}

function getInfoBgForRole(role: string) {
  switch (role) {
    case "staff":
      return "#fffbeb";
    case "doctor":
      return "#eef2ff";
    case "clinic":
      return "#f0fdfa";
    default:
      return "#f9fafb";
  }
}

function getInfoColorForRole(role: string) {
  switch (role) {
    case "staff":
      return "#92400e";
    case "doctor":
      return "#312e81";
    case "clinic":
      return "#134e4a";
    default:
      return "#374151";
  }
}

function getStepBgForRole(role: string) {
  switch (role) {
    case "staff":
      return "#fef3c7";
    case "doctor":
      return "#e0e7ff";
    case "clinic":
      return "#ccfbf1";
    default:
      return "#f3f4f6";
  }
}

function getStepColorForRole(role: string) {
  switch (role) {
    case "staff":
      return "#b45309";
    case "doctor":
      return "#3730a3";
    case "clinic":
      return "#0f766e";
    default:
      return "#6b7280";
  }
}

function getProfileButtons(role: string | undefined, locale: string, router: any) {
  const roleKey = role?.toLowerCase();

  if (roleKey === "doctor" || roleKey === "staff") {
    return (
      <button
        onClick={() => router.push("/doctorDash/settings")}
        className="w-full rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white py-3 text-sm font-semibold transition shadow-md hover:shadow-lg cursor-pointer"
      >
        {t("pendingPage.goToProfile", locale)}
      </button>
    );
  }

  if (roleKey === "clinic") {
    return (
      <button
        onClick={() => router.push("/clinicDash/settings")}
        className="w-full rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white py-3 text-sm font-semibold transition shadow-md hover:shadow-lg cursor-pointer"
      >
        {t("pendingPage.goToProfile", locale)}
      </button>
    );
  }

  return null;
}

function getConfig(role: string | undefined, locale: string): RoleConfig {
  const namespace = (role === "staff" || role === "doctor" || role === "clinic") ? role : "default";

  return {
    icon: getIconForRole(namespace),
    iconBg: getIconBgForRole(namespace),
    badge: t(`pendingPage.${namespace}.badge`, locale),
    badgeBg: getBadgeBgForRole(namespace),
    badgeColor: getBadgeColorForRole(namespace),
    title: t(`pendingPage.${namespace}.title`, locale),
    subtitle: t(`pendingPage.${namespace}.subtitle`, locale),
    infoBg: getInfoBgForRole(namespace),
    infoColor: getInfoColorForRole(namespace),
    infoText: t(`pendingPage.${namespace}.infoText`, locale),
    steps: [
      t(`pendingPage.${namespace}.step1`, locale),
      t(`pendingPage.${namespace}.step2`, locale),
      t(`pendingPage.${namespace}.step3`, locale),
    ],
    stepBg: getStepBgForRole(namespace),
    stepColor: getStepColorForRole(namespace),
  };
}
