"use client";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";


interface props {
  data: {
    date: string;
    exixiting: number;
    new: number;
  }[];
}

export default function ChartBar({ data }: props) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [New, setNew] = useState(false);
  const [old, setOld] = useState(false);

  let totall = 0;
  data.forEach((item) => {
    if (New) {
      totall = totall + item.new;
    } else if (old) {
      totall = totall + item.exixiting;
    } else {
      totall = totall + (item.exixiting + item.new);
    }
  });

  return (
    <div className="bg-(--card-bg) rounded-2xl border border-(--card-border) shadow-[var(--shadow-soft)] overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-3 border-b border-(--card-border) p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNew(false);
              setOld(false);
            }}
            className="w-full sm:w-auto border border-(--card-border) px-3 py-1.5 rounded-xl text-xs text-(--text-primary) font-medium cursor-pointer hover:text-white hover:bg-[color:var(--primary)] transition-colors duration-300"
          >
            {t("doctorDash.showAll", locale)}
          </button>
        </div>

        <h1 className="text-lg font-semibold text-(--text-primary)">
          {t("doctorDash.patientStats", locale)}
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-3 px-4 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setNew(true);
              setOld(false);
            }}
            className="flex items-center gap-2 text-xs text-(--text-secondary) hover:text-(--text-primary) transition"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full bg-[color:var(--primary)] ${New ? "ring-2 ring-[color:var(--primary)]/30" : ""}`}
            />
            {t("doctorDash.newPatients", locale)}
          </button>

          <button
            onClick={() => {
              setOld(true);
              setNew(false);
            }}
            className="flex items-center gap-2 text-xs text-(--text-secondary) hover:text-(--text-primary) transition"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full bg-[#D7DCF4] ${old ? "ring-2 ring-[#D7DCF4]/40" : ""}`}
            />
            {t("doctorDash.oldPatients", locale)}
          </button>
        </div>

        <h3 className="text-xs font-semibold text-(--text-secondary)">
          {t("doctorDash.totalPatientsCount", locale).replace("{count}", String(totall))}
        </h3>
      </div>

      {/* Chart */}
      <div className="h-64 min-h-64 w-full min-w-0 px-2 pb-4">
        {data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-semibold text-(--text-primary)">
                {t("doctorDash.noData", locale)}
              </p>
              <p className="text-xs text-(--text-secondary)">
                {t("doctorDash.noDataDesc", locale)}
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap={18} barGap={-20}>
              <defs>
                <linearGradient id="newGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--primary)"
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary)"
                    stopOpacity={0.2}
                  />
                </linearGradient>
                <linearGradient id="oldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D7DCF4" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#D7DCF4" stopOpacity={0.2} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 6"
                vertical={false}
                stroke="var(--card-border)"
              />

              <XAxis
                reversed={isRtl}
                dataKey="date"
                tickMargin={8}
                tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => {
                  try {
                    return format(new Date(value), "dd MMM");
                  } catch {
                    return String(value);
                  }
                }}
              />

              <YAxis
                orientation={isRtl ? "right" : "left"}
                tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                cursor={{ fill: "rgba(15,23,42,0.04)" }}
                contentStyle={{
                  borderRadius: "14px",
                  border: "none",
                  background: "var(--card-bg)",
                  color: "var(--text-primary)",
                  boxShadow: "var(--shadow-soft)",
                }}
              />

              {/* الفاتح */}
              <Bar
                dataKey="exixiting"
                className={`${New ? "hidden" : ""} duration-300`}
                fill="url(#oldGradient)"
                barSize={20}
                radius={[8, 8, 8, 8]}
              />

              {/* الغامق */}
              <Bar
                dataKey="new"
                className={`${old ? "hidden" : ""} duration-300`}
                fill="url(#newGradient)"
                barSize={20}
                radius={[8, 8, 8, 8]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
