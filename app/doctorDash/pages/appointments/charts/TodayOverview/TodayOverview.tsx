"use client";

import { Plus, Download, TrendingUp, TrendingDown } from "lucide-react";

interface TodayOverviewProps {
  totals?: {
    appointments: number;
    pending: number;
    cancellationRate: number;
  };
  todayCount?: number;
}

export default function TodayOverview({ totals, todayCount = 0 }: TodayOverviewProps) {
  const stats = [
    { title: "معدل الإلغاء", value: `${totals?.cancellationRate ?? 0}%`, change: 0 },
    { title: "في الانتظار", value: totals?.pending ?? 0, change: 0 },
    { title: "مواعيد اليوم", value: todayCount, change: 0 },
    { title: "إجمالي المواعيد", value: totals?.appointments ?? 0, change: 0 },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">

        {/* Buttons */}
        <div className="flex gap-2 order-2 sm:order-1">
          <button className="bg-[#1F2B6C] px-3 py-1.5 rounded-lg text-xs sm:text-sm text-white border border-(--input-border) flex items-center gap-1">
            إضافة موعد
            <Plus size={14} />
          </button>

          <button className="border border-(--input-border) bg-(--input-bg) px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1 hover:bg-(--hover-bg) transition-colors">
            <Download size={14} />
            تصدير
          </button>
        </div>

        {/* Title */}
        <div className="text-right order-1 sm:order-2">
          <h2 className="font-bold text-lg sm:text-2xl text-(--text-primary)">
            نظرة عامة علي المواعيد
          </h2>
          <p className="text-xs sm:text-md text-(--text-secondary)">
            تحليل ذكي لبيانات الجدول والتدفق ليوم {new Date().toLocaleDateString("ar-EG", { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-(--card-bg) border border-(--card-border) rounded-xl p-4 flex flex-col items-center sm:items-end gap-3 sm:gap-4 hover:-translate-y-1 hover:shadow-[0_2px_10px_var(--status-hover)] transition-all duration-300 ease-in-out"
          >

            <p className="text-md sm:text-xl text-(--text-secondary)">
              {s.title}
            </p>

            <h2 className="font-bold text-xl sm:text-3xl text-(--text-primary)">
              {s.value}
            </h2>

            <p
              className={`text-xs sm:text-md flex items-center gap-1 sm:gap-2 font-semibold ${
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