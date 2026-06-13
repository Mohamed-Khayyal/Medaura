"use client";

import {
  AreaChart,
  Area,
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
  Legend,
} from "recharts";
import type { DailyRevenue, MonthlyRevenue } from "@/app/clinicDash/financial/lib/types";
import { formatCurrencyCompact, formatCurrency } from "@/app/clinicDash/financial/lib/calculations";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";


interface Props {
  daily: DailyRevenue[];
  monthly: MonthlyRevenue[];
  clinicProfit: number;
  doctorsTotalEarnings: number;
  loading: boolean;
}

const tooltipStyle = {
  backgroundColor: "var(--card-bg, #1a2340)",
  border: "1px solid var(--card-border, #2a3660)",
  borderRadius: "12px",
  padding: "10px 14px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  color: "var(--text-primary, #e2e8f0)",
  fontSize: "13px",
};

const labelStyle = { color: "var(--text-secondary, #94a3b8)", marginBottom: 4 };

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div
      className="rounded-2xl bg-(--semi-card-bg) animate-pulse"
      style={{ height }}
    />
  );
}

type TooltipPayloadItem = { value: number; name: string; percent: number; fill?: string; payload?: { fill?: string } };

function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <p style={labelStyle}>{label}</p>
      <p className="font-bold text-teal-400">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const color = d.fill ?? d.payload?.fill;
  return (
    <div style={tooltipStyle}>
      <p style={labelStyle}>{d.name}</p>
      <p className="font-bold" style={{ color }}>{formatCurrency(d.value)}</p>
      <p className="text-xs opacity-70">{((d.percent ?? 0) * 100).toFixed(1)}%</p>
    </div>
  );
}

function DailyChart({ data, loading }: { data: DailyRevenue[]; loading: boolean }) {
  const locale = useLocale();
  const formatted = data.map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    revenue: d.revenue,
  }));

  return (
    <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-5 space-y-4 shadow-[var(--shadow-soft)]">
      <div>
        <h3 className="text-sm font-bold text-(--text-primary)">{t("financialPage.last30Days", locale)}</h3>
        <p className="text-xs text-(--text-secondary) mt-0.5">{t("financialPage.dailySum", locale)}</p>
      </div>
      {loading ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={formatted} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--text-secondary, #94a3b8)" }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tickFormatter={(v) => formatCurrencyCompact(v)}
              tick={{ fontSize: 10, fill: "var(--text-secondary, #94a3b8)" }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CurrencyTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#14b8a6"
              strokeWidth={2}
              fill="url(#tealGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#14b8a6", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function MonthlyChart({ data, loading }: { data: MonthlyRevenue[]; loading: boolean }) {
  const locale = useLocale();
  const formatted = data.map((d) => ({
    label: d.label.split(" ")[0], // Arabic month only
    revenue: d.revenue,
  }));

  return (
    <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-5 space-y-4 shadow-[var(--shadow-soft)]">
      <div>
        <h3 className="text-sm font-bold text-(--text-primary)">{t("financialPage.monthlySum", locale)}</h3>
        <p className="text-xs text-(--text-secondary) mt-0.5">{t("financialPage.monthlySumDesc", locale)}</p>
      </div>
      {loading ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={formatted} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--text-secondary, #94a3b8)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCurrencyCompact(v)}
              tick={{ fontSize: 10, fill: "var(--text-secondary, #94a3b8)" }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CurrencyTooltip />} />
            <Bar
              dataKey="revenue"
              fill="url(#blueGrad)"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

const PIE_COLORS = ["#f59e0b", "#14b8a6"];

function PieShareChart({
  clinicProfit,
  doctorsTotalEarnings,
  loading,
}: {
  clinicProfit: number;
  doctorsTotalEarnings: number;
  loading: boolean;
}) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const total = clinicProfit + doctorsTotalEarnings;
  const pieData = [
    { name: t("financialPage.yourEarnings", locale), value: doctorsTotalEarnings },
    { name: t("financialPage.clinicShare", locale), value: clinicProfit },
  ];

  return (
    <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-5 space-y-4 shadow-[var(--shadow-soft)]">
      <div>
        <h3 className="text-sm font-bold text-(--text-primary)">{t("financialPage.distribution", locale)}</h3>
        <p className="text-xs text-(--text-secondary) mt-0.5">{t("financialPage.vsClinic", locale)}</p>
      </div>
      {loading ? (
        <ChartSkeleton height={240} />
      ) : total === 0 ? (
        <div className="flex items-center justify-center h-[240px] text-(--text-secondary) text-sm">
          {isRtl ? "لا توجد بيانات حتى الآن" : "No data available yet"}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {pieData.map((_, index) => (
                <Cell key={index} fill={PIE_COLORS[index]} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function RevenueCharts({
  daily,
  monthly,
  clinicProfit,
  doctorsTotalEarnings,
  loading,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <PieShareChart clinicProfit={clinicProfit} doctorsTotalEarnings={doctorsTotalEarnings} loading={loading} />
      </div>
      <div className="lg:col-span-1">
        <DailyChart data={daily} loading={loading} />
      </div>
      <div className="lg:col-span-1">
        <MonthlyChart data={monthly} loading={loading} />
      </div>
    </div>
  );
}
