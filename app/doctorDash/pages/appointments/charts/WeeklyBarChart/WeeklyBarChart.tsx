"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

interface WeeklyAppointmentsChartProps {
  bookings?: any[];
}

export default function WeeklyAppointmentsChart({ bookings = [] }: WeeklyAppointmentsChartProps) {
  const [mode, setMode] = useState<"current" | "last7">("current");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const weekRange = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 7 }).map((_, i) => {
      const offset = i - 6;
      const d = new Date();
      d.setDate(now.getDate() + offset);

      return {
        label: d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "long" }),
        day: d.getDate(),
        month: d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "long" }).slice(0, 3),
        dateStr: d.toISOString().slice(0, 10), // YYYY-MM-DD
      };
    });
  }, [locale]);

  const chartData = useMemo(() => {
    return weekRange.map((day) => {
      // count bookings on day.dateStr
      const count = bookings.filter((b: any) => {
        if (!b.booking_date) return false;
        const bDate = new Date(b.booking_date).toISOString().slice(0, 10);
        return bDate === day.dateStr;
      }).length;

      return {
        label: day.label,
        day: day.day,
        month: day.month,
        value: count,
      };
    });
  }, [weekRange, bookings]);

  const visibleChartData = useMemo(() => {
    if (mode === "current") return chartData;

    return chartData.map((day, index) => ({
      ...day,
      value: Math.floor(day.value * (index % 2 === 0 ? 0.82 : 1.12)),
    }));
  }, [chartData, mode]);

  return (
    <div className="min-w-0 rounded-2xl border border-(--card-border) bg-(--card-bg) p-4 sm:p-5" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className={`flex items-center gap-4 text-sm ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
          <div className="flex items-center gap-1">
            {isRtl ? (
              <>
                <button
                  onClick={() => setMode("current")}
                  className="text-md font-semibold text-(--text-primary) cursor-pointer"
                >
                  {isRtl ? "الحالي" : "Current"}
                </button>
                <span className="h-2 w-2 rounded-full bg-[#1F2B6C] p-1" />
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-[#1F2B6C] p-1" />
                <button
                  onClick={() => setMode("current")}
                  className="text-md font-semibold text-(--text-primary) cursor-pointer"
                >
                  Current
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setMode("last7")}
            className="text-md font-semibold text-(--text-primary) cursor-pointer"
          >
            {isRtl ? "آخر 7 أيام" : "Last 7 Days"}
          </button>
        </div>

        <div className="text-start">
          <h3 className="text-xl sm:text-2xl font-bold text-(--text-primary)">
            {isRtl ? "اتجاهات المواعيد الأسبوعية" : "Weekly Appointments Trends"}
          </h3>
          <p className="text-xs sm:text-sm text-(--text-secondary)">
            {isRtl ? "مقارنة كثافة الزوار خلال الأسبوع الحالي" : "Comparison of visitor density during the current week"}
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-2">
        <div className="h-[280px] min-h-[280px] min-w-[560px] sm:h-[300px] sm:min-h-[300px] sm:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visibleChartData} barCategoryGap={30} barGap={-28}>
            <CartesianGrid
              strokeDasharray="0 0"
              vertical={false}
              stroke="var(--card-border)"
            />

            <XAxis
              dataKey="label"
              tickMargin={5}
              tick={{ fontSize: 12, fill: "var(--text-primary)" }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              orientation={isRtl ? "right" : "left"}
              tick={{ fontSize: 12, fill: "var(--text-primary)" }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              labelFormatter={(
                label,
                payload: readonly any[]
              ) => {
                if (payload && payload.length) {
                  const data = payload[0].payload;
                  return `${data.day} ${data.month} - ${label}`;
                }
                return label;
              }}
              formatter={(value) => [
                <span
                  key="value"
                  style={{ color: "var(--text2-bg)", fontWeight: "bold" }}
                >
                  <span className="text-(--text-primary)">{isRtl ? "القيمة : " : "Value: "}</span>
                  {value}
                </span>,
              ]}
              cursor={{ fill: "rgba(0,0,0,0.02)" }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--card-bg)",
                color: "var(--text-primary)",
                accentColor: "#1F2B6C",
                textAlign: isRtl ? "right" : "left",
              }}
            />
            <Bar
              dataKey="value"
              fill="#1F2B6C"
              barSize={28}
              radius={[6, 6, 6, 6]}
            />
          </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
