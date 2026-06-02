"use client";

import { useId } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import type { ClinicMyStats } from "@/lib/types/api";

interface StatsSectionProps {
  stats: ClinicMyStats | null;
  loading: boolean;
}

const TEAL_PALETTE = ["#14b8a6", "#0d9488", "#0f766e", "#5eead4", "#99f6e4", "#2dd4bf"];

const BOOKING_STATUS_COLORS: Record<string, string> = {
  confirmed: "#14b8a6",
  pending: "#f59e0b",
  cancelled: "#f87171",
};

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
};

type ArabicTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
};

const ArabicTooltip = ({ active, payload, label }: ArabicTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-(--card-bg) border border-(--card-border) rounded-xl px-4 py-2.5 shadow-[var(--shadow-hover)] text-sm">
      {label && (
        <p className="font-semibold text-(--text-primary) mb-1 text-xs">{label}</p>
      )}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium text-xs">
          {entry.name}:{" "}
          <span className="font-bold">
            {typeof entry.value === "number"
              ? entry.value.toLocaleString("ar-EG")
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
};

// Skeleton loader for chart cards
function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`${height} rounded-2xl bg-(--semi-card-bg) animate-pulse`} />
  );
}

// Donut chart center label
function DonutCenterLabel({
  total,
  label,
  color,
}: {
  total: number;
  label: string;
  color: string;
}) {
  return (
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-current"
    >
      <tspan
        x="50%"
        dy="-8"
        fontSize="22"
        fontWeight="700"
        fill={color}
      >
        {total.toLocaleString("ar-EG")}
      </tspan>
      <tspan x="50%" dy="20" fontSize="11" fill="#94a3b8">
        {label}
      </tspan>
    </text>
  );
}

// Legend item with count badge
function LegendBadge({
  items,
}: {
  items: { name: string; value: number; color: string }[];
}) {
  const total = items.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-3">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: item.color }}
          />
          <span className="text-xs text-(--text-secondary)">{item.name}</span>
          <span
            className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{
              background: item.color + "22",
              color: item.color,
            }}
          >
            {total > 0
              ? `${Math.round((item.value / total) * 100)}%`
              : "0%"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function StatsSection({ stats, loading }: StatsSectionProps) {
  const barGradId = useId();
  const weekGradId = useId();

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ChartSkeleton height="h-72" />
        </div>
        <ChartSkeleton height="h-72" />
        <ChartSkeleton height="h-64" />
        <ChartSkeleton height="h-64" />
      </div>
    );
  }

  // ── Data derivation ──────────────────────────────────────────────────────────

  const hasMonthlyData =
    stats?.monthly_bookings && stats.monthly_bookings.length > 0;
  const monthlyChartData = hasMonthlyData
    ? stats!.monthly_bookings!.map((item) => ({
        name: item.month,
        الحجوزات: item.count,
      }))
    : null;

  const hasWeeklyData =
    stats?.weekly_bookings && stats.weekly_bookings.length > 0;
  const weeklyChartData = hasWeeklyData
    ? stats!.weekly_bookings!.map((item) => ({
        name: item.day,
        الحجوزات: item.count,
      }))
    : null;

  const hasSpecialtyData =
    stats?.staff_by_specialty && stats.staff_by_specialty.length > 0;
  const specialtyPieData = hasSpecialtyData
    ? stats!.staff_by_specialty!.map((item) => ({
        name: item.specialty,
        value: item.count,
        color: TEAL_PALETTE[
          stats!.staff_by_specialty!.indexOf(item) % TEAL_PALETTE.length
        ],
      }))
    : null;

  const bookingStatusData = [
    {
      name: "مؤكدة",
      value: stats?.confirmed_bookings ?? 0,
      color: BOOKING_STATUS_COLORS.confirmed,
    },
    {
      name: "معلقة",
      value: stats?.pending_bookings ?? 0,
      color: BOOKING_STATUS_COLORS.pending,
    },
    {
      name: "ملغاة",
      value: stats?.cancelled_bookings ?? 0,
      color: BOOKING_STATUS_COLORS.cancelled,
    },
  ].filter((d) => d.value > 0);

  const hasBookingStatusData = bookingStatusData.length > 0;
  const totalStatusBookings = bookingStatusData.reduce(
    (s, d) => s + d.value,
    0
  );
  const totalSpecialty =
    specialtyPieData?.reduce((s, d) => s + d.value, 0) ?? 0;

  const noChartData =
    !monthlyChartData &&
    !weeklyChartData &&
    !specialtyPieData &&
    !hasBookingStatusData;

  if (noChartData) return null;

  // Whether we show bar or line for weekly
  const showWeeklyLine = hasWeeklyData && !hasMonthlyData;

  return (
    <div
      className="space-y-5"
      style={{ animation: "fadeUp 0.55s ease both", animationDelay: "150ms" }}
    >
      {/* Row 1: Main bar chart (2/3) + Booking status donut (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar / Line chart */}
        {(monthlyChartData || weeklyChartData) && (
          <div
            className="lg:col-span-2 rounded-2xl border border-(--card-border) bg-(--card-bg) shadow-[var(--shadow-soft)] p-5 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4" dir="rtl">
              <div>
                <h3 className="text-sm font-bold text-(--text-primary)">
                  {monthlyChartData ? "الحجوزات الشهرية" : "الحجوزات الأسبوعية"}
                </h3>
                <p className="text-xs text-(--text-secondary) mt-0.5">
                  {monthlyChartData
                    ? "إجمالي الحجوزات لكل شهر"
                    : "توزيع الحجوزات على أيام الأسبوع"}
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                {(monthlyChartData ?? weeklyChartData!).reduce(
                  (s, d) => s + d.الحجوزات,
                  0
                ).toLocaleString("ar-EG")}{" "}
                حجز
              </span>
            </div>

            <div className="flex-1 h-56">
              <ResponsiveContainer width="100%" height="100%">
                {showWeeklyLine ? (
                  <AreaChart
                    data={weeklyChartData!}
                    margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id={weekGradId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#14b8a6"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="#14b8a6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.12)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ArabicTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="الحجوزات"
                      stroke="#14b8a6"
                      strokeWidth={2.5}
                      fill={`url(#${weekGradId})`}
                      dot={{ fill: "#14b8a6", r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive
                      animationDuration={900}
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={monthlyChartData ?? weeklyChartData!}
                    margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id={barGradId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#14b8a6"
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor="#0d9488"
                          stopOpacity={0.8}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.12)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ArabicTooltip />} />
                    <Bar
                      dataKey="الحجوزات"
                      fill={`url(#${barGradId})`}
                      radius={[8, 8, 0, 0]}
                      maxBarSize={52}
                      isAnimationActive
                      animationDuration={900}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Booking status donut */}
        {hasBookingStatusData && (
          <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) shadow-[var(--shadow-soft)] p-5 flex flex-col">
            <div dir="rtl" className="mb-2">
              <h3 className="text-sm font-bold text-(--text-primary)">
                حالة الحجوزات
              </h3>
              <p className="text-xs text-(--text-secondary) mt-0.5">
                نسب الحجوزات المؤكدة والمعلقة والملغاة
              </p>
            </div>

            <div className="flex-1 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="none" />
                    ))}
                    <DonutCenterLabel
                      total={totalStatusBookings}
                      label="حجز"
                      color="#14b8a6"
                    />
                  </Pie>
                  <Tooltip content={<ArabicTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <LegendBadge items={bookingStatusData} />
          </div>
        )}
      </div>

      {/* Row 2: Weekly line (if monthly exists) + Specialty donut */}
      {((hasWeeklyData && hasMonthlyData) || hasSpecialtyData) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Weekly area chart — only show if monthly was already shown */}
          {hasWeeklyData && hasMonthlyData && (
            <div className="lg:col-span-2 rounded-2xl border border-(--card-border) bg-(--card-bg) shadow-[var(--shadow-soft)] p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4" dir="rtl">
                <div>
                  <h3 className="text-sm font-bold text-(--text-primary)">
                    الحجوزات الأسبوعية
                  </h3>
                  <p className="text-xs text-(--text-secondary) mt-0.5">
                    توزيع الحجوزات على أيام الأسبوع
                  </p>
                </div>
              </div>
              <div className="flex-1 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={weeklyChartData!}
                    margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id={`${weekGradId}-2`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#1f6feb"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="#1f6feb"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.12)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ArabicTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="الحجوزات"
                      stroke="#1f6feb"
                      strokeWidth={2.5}
                      fill={`url(#${weekGradId}-2)`}
                      dot={{ fill: "#1f6feb", r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      isAnimationActive
                      animationDuration={900}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Specialty donut */}
          {specialtyPieData && (
            <div
              className={
                hasWeeklyData && hasMonthlyData
                  ? "rounded-2xl border border-(--card-border) bg-(--card-bg) shadow-[var(--shadow-soft)] p-5 flex flex-col"
                  : "lg:col-span-1 rounded-2xl border border-(--card-border) bg-(--card-bg) shadow-[var(--shadow-soft)] p-5 flex flex-col"
              }
            >
              <div dir="rtl" className="mb-2">
                <h3 className="text-sm font-bold text-(--text-primary)">
                  توزيع الأطباء حسب التخصص
                </h3>
                <p className="text-xs text-(--text-secondary) mt-0.5">
                  نسبة كل تخصص من إجمالي الأطباء
                </p>
              </div>

              <div className="flex-1 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={specialtyPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="value"
                      isAnimationActive
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {specialtyPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="none" />
                      ))}
                      <DonutCenterLabel
                        total={totalSpecialty}
                        label="طبيب"
                        color="#14b8a6"
                      />
                    </Pie>
                    <Tooltip content={<ArabicTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <LegendBadge items={specialtyPieData} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
