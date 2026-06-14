"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import { formatCurrencyCompact } from "../lib/calculations";
import type { DoctorFinancialRecord } from "../lib/types";

interface Props {
  records: DoctorFinancialRecord[];
  loading: boolean;
}

export default function DoctorEarningsOverview({ records, loading }: Props) {
  // Sort by doctor earnings descending
  const sortedRecords = [...records].sort((a, b) => b.doctorEarnings - a.doctorEarnings);

  const data = sortedRecords.map(r => ({
    name: r.doctorName.split(" ").slice(0, 2).join(" "), // First 2 names
    إيرادات: r.totalRevenue,
    حصة_الطبيب: r.doctorEarnings,
    حصة_العيادة: r.clinicProfit,
  }));

  if (loading) {
    return (
      <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-5 shadow-[var(--shadow-soft)] animate-pulse h-[300px]">
        <div className="h-6 w-48 bg-(--semi-card-bg) rounded mb-4"></div>
        <div className="h-full bg-(--semi-card-bg) rounded"></div>
      </div>
    );
  }

  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-5 space-y-4 shadow-[var(--shadow-soft)]" dir="rtl">
      <div>
        <h3 className="text-sm font-bold text-(--text-primary)">ملخص أرباح الأطباء</h3>
        <p className="text-xs text-(--text-secondary) mt-0.5">إجمالي حصة كل طبيب مقارنة بحصة العيادة</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 0, bottom: 20, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 11, fill: "var(--text-secondary, #94a3b8)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tickFormatter={(v) => formatCurrencyCompact(v)}
            tick={{ fontSize: 11, fill: "var(--text-secondary, #94a3b8)" }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip 
            formatter={(value: number) => [`${value} EGP`, undefined]}
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "12px" }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="حصة_الطبيب" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} name="حصة الطبيب" />
          <Bar dataKey="حصة_العيادة" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} name="حصة العيادة" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
