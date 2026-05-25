"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PendingApprovalPage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f4f8]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d9e3ff] border-t-indigo-700" />
      </div>
    );
  }

  const role = user?.user_type?.toLowerCase();

  const config = getConfig(role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f5f7ff] to-[#e8f4ff] flex items-center justify-center p-4" dir="rtl">
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
              <div className="h-10 w-10 rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <span className="text-xl font-semibold text-indigo-900">Medaura</span>
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
            className="rounded-2xl p-4 mb-8 text-sm leading-relaxed text-right"
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
              <div key={i} className="flex items-center gap-3 text-right">
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

          {/* Logout button */}
          <button
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            تسجيل الخروج
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-gray-400">
          إذا كانت لديك استفسارات، يرجى التواصل مع الدعم الفني
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

function getConfig(role: string | undefined): RoleConfig {
  switch (role) {
    case "staff":
      return {
        icon: (
          <svg className="h-12 w-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        iconBg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        badge: "في انتظار موافقة العيادة",
        badgeBg: "#fef9ec",
        badgeColor: "#d97706",
        title: "بانتظار موافقة العيادة",
        subtitle: "تم تسجيل حسابك بنجاح! يحتاج الانضمام إلى العيادة إلى موافقة مدير العيادة.",
        infoBg: "#fffbeb",
        infoColor: "#92400e",
        infoText: "سيقوم مدير العيادة بمراجعة طلبك والموافقة عليه قريباً. ستتمكن من الوصول إلى لوحة التحكم بعد قبول طلبك.",
        steps: [
          "تم إنشاء حسابك بنجاح ✓",
          "في انتظار مراجعة مدير العيادة",
          "الحصول على الموافقة والدخول للوحة التحكم",
        ],
        stepBg: "#fef3c7",
        stepColor: "#b45309",
      };

    case "doctor":
      return {
        icon: (
          <svg className="h-12 w-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        iconBg: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
        badge: "في انتظار موافقة الإدارة",
        badgeBg: "#eef2ff",
        badgeColor: "#4338ca",
        title: "بانتظار موافقة الإدارة",
        subtitle: "تم تسجيل طلبك كطبيب بنجاح. يتطلب التحقق من بياناتك مراجعة من قِبل فريق الإدارة.",
        infoBg: "#eef2ff",
        infoColor: "#312e81",
        infoText: "يقوم فريق إدارة Medaura بمراجعة وثائقك وبياناتك المهنية للتحقق منها. ستُخطَر عند اكتمال المراجعة.",
        steps: [
          "تم تسليم بياناتك المهنية ✓",
          "مراجعة الوثائق من قِبل فريق الإدارة",
          "الحصول على الاعتماد والوصول للوحة التحكم",
        ],
        stepBg: "#e0e7ff",
        stepColor: "#3730a3",
      };

    case "clinic":
      return {
        icon: (
          <svg className="h-12 w-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
        iconBg: "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)",
        badge: "في انتظار موافقة الإدارة",
        badgeBg: "#f0fdfa",
        badgeColor: "#0f766e",
        title: "بانتظار اعتماد العيادة",
        subtitle: "تم تسجيل عيادتك بنجاح! تحتاج إلى موافقة الإدارة قبل البدء في استقبال المواعيد.",
        infoBg: "#f0fdfa",
        infoColor: "#134e4a",
        infoText: "يقوم فريق إدارة Medaura بمراجعة معلومات عيادتك والتحقق منها. ستتمكن من استخدام لوحة تحكم العيادة بعد الموافقة.",
        steps: [
          "تم تسجيل بيانات العيادة بنجاح ✓",
          "مراجعة الطلب من قِبل فريق الإدارة",
          "الحصول على الاعتماد وإدارة العيادة",
        ],
        stepBg: "#ccfbf1",
        stepColor: "#0f766e",
      };

    default:
      return {
        icon: (
          <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        iconBg: "#f3f4f6",
        badge: "في الانتظار",
        badgeBg: "#f9fafb",
        badgeColor: "#6b7280",
        title: "في انتظار الموافقة",
        subtitle: "حسابك قيد المراجعة.",
        infoBg: "#f9fafb",
        infoColor: "#374151",
        infoText: "يُرجى الانتظار حتى تتم مراجعة حسابك.",
        steps: ["إنشاء الحساب ✓", "مراجعة الطلب", "الوصول للمنصة"],
        stepBg: "#f3f4f6",
        stepColor: "#6b7280",
      };
  }
}
