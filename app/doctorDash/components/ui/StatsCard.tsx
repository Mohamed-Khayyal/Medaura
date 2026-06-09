"use client";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useId } from "react";

interface statscardProps {
  title: string;
  value: number;
  percentage: number;
  icon: React.ReactNode;
  iconBg: string;
  chartColor: string;
  data: { value: number }[];
}

export default function StatsCard({
  title,
  value,
  percentage,
  icon,
  iconBg,
  chartColor,
  data,
}: statscardProps) {
  const gradientID = useId();

  return (
    <div className="group w-full rounded-2xl border border-(--card-border) bg-(--card-bg) shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 transition-all duration-300">
      {/* Top Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4">
        {/* percentage */}
        <div className="sm:order-2">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${percentage >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
          >
            {percentage > 0 ? "+" : ""}
            {percentage}%
          </span>
        </div>

        <div className="flex flex-row-reverse sm:flex-row gap-3 items-center justify-between sm:justify-start">
          <div
            className={`${iconBg} w-9 h-9 sm:w-10 sm:h-10 p-2 rounded-2xl flex items-center justify-center shadow-sm`}
          >
            {icon}
          </div>

          <div className="text-right">
            <p
              className="text-xs sm:text-sm font-semibold text-(--text-secondary)"
              style={{ color: chartColor }}
            >
              {title}
            </p>

            <h3 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              {title === "المعاملات" ? "$" : ""}
              {value.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* mini chart */}
      <div className="h-20 min-h-20 w-full min-w-0 px-3 pb-3">
        <ResponsiveContainer width={"100%"} height={"100%"}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.45} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2.5}
              fill={`url(#${gradientID})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
