"use client";

import { Plus, Download, TrendingUp, TrendingDown } from "lucide-react";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

interface TodayOverviewProps {
  totals?: {
    appointments: number;
    pending: number;
    cancellationRate: number;
  };
  todayCount?: number;
}

export default function TodayOverview({ totals, todayCount = 0 }: TodayOverviewProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const stats = [
    { title: isRtl ? "معدل الإلغاء" : "Cancellation Rate", value: `${totals?.cancellationRate ?? 0}%`, change: 0 },
    { title: t("doctorDashPages.todayAppointments.accessPending", locale) || (isRtl ? "في الانتظار" : "Pending"), value: totals?.pending ?? 0, change: 0 },
    { title: isRtl ? "مواعيد اليوم" : "Today's Appointments", value: todayCount, change: 0 },
    { title: isRtl ? "إجمالي المواعيد" : "Total Appointments", value: totals?.appointments ?? 0, change: 0 },
  ];

  const formattedDate = new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">

        {/* Buttons */}
        <div className={`order-2 grid grid-cols-2 gap-2 sm:order-1 sm:flex ${isRtl ? "justify-start" : "justify-end"}`}>
          <button className="flex items-center justify-center gap-1 rounded-lg border border-(--input-border) bg-[#1F2B6C] px-3 py-2 text-xs text-white transition hover:bg-[#162056] sm:text-sm">
            {isRtl ? (
              <>
                إضافة موعد
                <Plus size={14} />
              </>
            ) : (
              <>
                <Plus size={14} />
                Add Appointment
              </>
            )}
          </button>

          <button className="flex items-center justify-center gap-1 rounded-lg border border-(--input-border) bg-(--input-bg) px-3 py-2 text-xs font-bold transition-colors hover:bg-(--hover-bg) sm:text-sm">
            <Download size={14} />
            {isRtl ? "تصدير" : "Export"}
          </button>
        </div>

        {/* Title */}
        <div className="text-start order-1 sm:order-2">
          <h2 className="font-bold text-lg sm:text-2xl text-(--text-primary)">
            {isRtl ? "نظرة عامة على المواعيد" : "Appointments Overview"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-(--text-secondary) sm:text-sm">
            {isRtl
              ? `تحليل ذكي لبيانات الجدول والتدفق ليوم ${formattedDate}`
              : `Smart analysis of schedule data for ${formattedDate}`
            }
          </p>
        </div>

      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

        {stats.map((s, i) => (
          <div
            key={i}
            className={`bg-(--card-bg) border border-(--card-border) rounded-xl p-4 flex flex-col items-center gap-3 sm:gap-4 hover:-translate-y-1 hover:shadow-[0_2px_10px_var(--status-hover)] transition-all duration-300 ease-in-out ${
              isRtl ? "sm:items-end" : "sm:items-start"
            }`}
          >

            <p className="text-sm sm:text-base text-(--text-secondary)">
              {s.title}
            </p>

            <h2 className="font-bold text-xl sm:text-3xl text-(--text-primary)">
              {s.value}
            </h2>

            <p
              className={`text-xs sm:text-sm flex items-center gap-1 sm:gap-2 font-semibold ${
                s.change >= 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {s.change >= 0 ? "+" : ""}
              {s.change}%
              {s.change >= 0 ? (
                <TrendingUp strokeWidth={2.5} size={14} />
              ) : (
                <TrendingDown strokeWidth={2.5} size={14} />
              )}
            </p>

          </div>
        ))}

      </div>

    </div>
  );
}
