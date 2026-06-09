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

interface WeeklyAppointmentsChartProps {
  bookings?: any[];
}

export default function WeeklyAppointmentsChart({ bookings = [] }: WeeklyAppointmentsChartProps) {
  const [mode, setMode] = useState<"current" | "last7">("current");

  const weekRange = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 7 }).map((_, i) => {
      const offset = i - 6;
      const d = new Date();
      d.setDate(now.getDate() + offset);

      return {
        label: d.toLocaleDateString("ar-EG", { weekday: "long" }),
        day: d.getDate(),
        month: d.toLocaleDateString("en-EG", { month: "long" }).slice(0, 3),
        dateStr: d.toISOString().slice(0, 10), // YYYY-MM-DD
      };
    });
  }, []);

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
    <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => setMode("last7")}
            className="text-md font-semibold text-(--text-primary)"
          >
            آخر 7 أيام
          </button>

          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#1F2B6C] p-1" />
            <button
              onClick={() => setMode("current")}
              className="text-md font-semibold text-(--text-primary)"
            >
              الحالي
            </button>
          </div>
        </div>

        <div className="text-right">
          <h3 className="text-2xl font-bold text-(--text-primary)">
            اتجاهات المواعيد الأسبوعية
          </h3>
          <p className="text-md text-(--text-secondary)">
            مقارنة كثافة الزوار خلال الأسبوع الحالي
          </p>
        </div>
      </div>

      <div className="h-[300px] min-h-[300px] w-full min-w-0">
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
              orientation="right"
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
                  <span className="text-(--text-primary)">value : </span>
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
  );
}
