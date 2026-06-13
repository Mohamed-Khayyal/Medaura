"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
import FinancialOverviewCards from "./components/FinancialOverviewCards";
import RevenueCharts from "./components/RevenueCharts";
import FinancialFilters from "./components/FinancialFilters";
import ExportButtons from "./components/ExportButtons";
import DoctorEarningsTable from "./components/DoctorEarningsTable";
import type {
  FinancialSummary,
  DailyRevenue,
  MonthlyRevenue,
  AppointmentRecord,
  FinancialFilters as FiltersType,
} from "@/app/clinicDash/financial/lib/types";
import { currentMonthStr } from "@/app/clinicDash/financial/lib/calculations";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";


interface SummaryData {
  summary: FinancialSummary;
  monthly: MonthlyRevenue[];
  daily: DailyRevenue[];
}

interface TransactionData {
  doctorRecords: any[];
  appointmentRecords: AppointmentRecord[];
  specialties: string[];
}

function buildDateRange(period: FiltersType["period"]): { dateFrom?: string; dateTo?: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  switch (period) {
    case "today":  return { dateFrom: fmt(today), dateTo: fmt(today) };
    case "week": {
      const s = new Date(today); s.setDate(today.getDate() - 6);
      return { dateFrom: fmt(s), dateTo: fmt(today) };
    }
    case "month": {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { dateFrom: fmt(s), dateTo: fmt(today) };
    }
    case "year": {
      const s = new Date(today.getFullYear(), 0, 1);
      return { dateFrom: fmt(s), dateTo: fmt(today) };
    }
    default: return {};
  }
}

export default function DoctorFinancialPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [txData, setTxData]           = useState<TransactionData | null>(null);
  const [summaryLoading, setSummaryLoading]   = useState(true);
  const [txLoading, setTxLoading]             = useState(true);
  const [error, setError]                     = useState<string | null>(null);

  const [filters, setFilters] = useState<FiltersType>({ period: "month" });

  const activePeriod = (() => {
    if (filters.period === "today" || filters.period === "week") return currentMonthStr();
    if (filters.period === "year") return String(new Date().getFullYear());
    if (filters.period === "custom" && filters.dateFrom) return filters.dateFrom.slice(0, 7);
    return currentMonthStr();
  })();

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res  = await fetch("/api/doctor/financial/summary");
      const json = await res.json() as { success: boolean; data: SummaryData; error?: string };
      if (json.success) {
        setSummaryData(json.data);
      } else {
        setError(json.error ?? (isRtl ? "خطأ في تحميل الملخص" : "Failed to load summary"));
      }
    } catch {
      setError(isRtl ? "تعذّر الاتصال بالسيرفر" : "Server connection failed");
    } finally {
      setSummaryLoading(false);
    }
  }, [isRtl]);

  const fetchTransactions = useCallback(async (f: FiltersType) => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.period && f.period !== "custom") {
        const range = buildDateRange(f.period);
        if (range.dateFrom) params.set("date_from", range.dateFrom);
        if (range.dateTo)   params.set("date_to",   range.dateTo);
      } else {
        if (f.dateFrom) params.set("date_from", f.dateFrom);
        if (f.dateTo)   params.set("date_to",   f.dateTo);
      }
      params.set("period", activePeriod);

      const res  = await fetch(`/api/doctor/financial/transactions?${params}`);
      const json = await res.json() as { success: boolean; data: TransactionData; error?: string };
      if (json.success) {
        setTxData(json.data);
      } else {
        setError(json.error ?? (isRtl ? "خطأ في تحميل المعاملات" : "Failed to load transactions"));
      }
    } catch {
      setError(isRtl ? "تعذّر الاتصال بالسيرفر" : "Server connection failed");
    } finally {
      setTxLoading(false);
    }
  }, [activePeriod, isRtl]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    void fetchTransactions(filters);
  }, [filters, fetchTransactions]);

  const handleRefresh = () => {
    void fetchSummary();
    void fetchTransactions(filters);
  };

  const handleReset = () => setFilters({ period: "month" });

  const doctorPct = txData?.doctorRecords?.[0]?.doctorPercentage ?? 70;
  const completedAppointmentsCount = txData?.doctorRecords?.[0]?.completedAppointments ?? 0;

  return (
    <div className="space-y-6 p-4 sm:p-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
              <TrendingUp size={16} className="text-teal-400" />
            </span>
            <h1 className="text-xl font-bold text-(--text-primary)">
              {t("financialPage.title", locale)}
            </h1>
          </div>
          <p className="text-sm text-(--text-secondary) pr-10">
            {t("financialPage.subtitle", locale)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ExportButtons records={txData?.appointmentRecords ?? []} period={activePeriod} />
          
          <button
            onClick={handleRefresh}
            disabled={summaryLoading || txLoading}
            className="p-2 rounded-xl border border-(--card-border) bg-(--card-bg) text-(--text-secondary) hover:text-teal-400 hover:border-teal-500/40 transition-all shadow-[var(--shadow-soft)] disabled:opacity-50"
            title={isRtl ? "تحديث فوري" : "Instant Refresh"}
          >
            <RefreshCw size={15} className={summaryLoading || txLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-400 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="mr-auto text-xs underline hover:no-underline">
            {isRtl ? "إغلاق" : "Close"}
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <FinancialOverviewCards
        summary={summaryData?.summary ?? null}
        loading={summaryLoading}
        completedAppointmentsCount={completedAppointmentsCount}
        doctorPercentage={doctorPct}
      />

      {/* Charts */}
      <RevenueCharts
        daily={summaryData?.daily ?? []}
        monthly={summaryData?.monthly ?? []}
        doctorsTotalEarnings={summaryData?.summary.doctorsTotalEarnings ?? 0}
        clinicProfit={summaryData?.summary.clinicProfit ?? 0}
        loading={summaryLoading}
      />

      {/* Filters */}
      <FinancialFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleReset}
      />

      {/* Earnings Table */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold text-(--text-primary)">
              {t("financialPage.earningDetails", locale)}
            </h2>
            <p className="text-xs text-(--text-secondary) mt-0.5">
              {t("financialPage.earningDetailsDesc", locale)}
            </p>
          </div>
          <span className="text-xs text-(--text-secondary) bg-(--semi-card-bg) px-3 py-1 rounded-full border border-(--card-border)">
            {t("financialPage.period", locale)}: {activePeriod}
          </span>
        </div>

        <DoctorEarningsTable
          records={txData?.appointmentRecords ?? []}
          loading={txLoading}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
