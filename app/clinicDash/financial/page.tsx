"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TrendingUp, RefreshCw, Clock } from "lucide-react";
import FinancialOverviewCards from "./components/FinancialOverviewCards";
import DoctorEarningsTable from "./components/DoctorEarningsTable";
import ProfitSharingModal from "./components/ProfitSharingModal";
import RevenueCharts from "./components/RevenueCharts";
import FinancialFilters from "./components/FinancialFilters";
import ExportButtons from "./components/ExportButtons";
import type {
  FinancialSummary,
  DailyRevenue,
  MonthlyRevenue,
  DoctorFinancialRecord,
  FinancialFilters as FiltersType,
} from "./lib/types";
import { currentMonthStr } from "./lib/calculations";

// ── Constants ─────────────────────────────────────────────────────────────────
const SUMMARY_CACHE_KEY  = "financial_summary_cache";
const SUMMARY_TS_KEY     = "financial_summary_ts";
const EGYPT_TZ           = "Africa/Cairo";
const DAILY_REFRESH_HOUR = 21; // 9 PM Egypt time
/** Check every 5 minutes whether the 9 PM boundary was crossed */
const CHECK_INTERVAL_MS  = 5 * 60 * 1000;

// ── Types ─────────────────────────────────────────────────────────────────────
interface SummaryData {
  summary: FinancialSummary;
  monthly: MonthlyRevenue[];
  daily: DailyRevenue[];
}

interface TransactionData {
  doctorRecords: DoctorFinancialRecord[];
  specialties: string[];
}

// ── Egypt-time helpers ────────────────────────────────────────────────────────

/**
 * Returns the Unix timestamp (ms) of the most recent 9 PM Egypt time.
 * If we're currently past 9 PM today (Egypt), returns today's 9 PM.
 * Otherwise returns yesterday's 9 PM.
 */
function lastEgypt9PMTimestamp(): number {
  const now = new Date();

  // Get current hour in Egypt timezone
  const egyptHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: EGYPT_TZ,
    }).format(now),
    10
  );

  // Get today's date components in Egypt timezone
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: EGYPT_TZ,
  }).formatToParts(now);

  const year  = parseInt(parts.find((p) => p.type === "year")!.value, 10);
  const month = parseInt(parts.find((p) => p.type === "month")!.value, 10) - 1;
  const day   = parseInt(parts.find((p) => p.type === "day")!.value, 10);

  // Build today's 9 PM in Egypt → convert to UTC ms
  // We approximate by using the Egypt offset from current Date diff
  const egyptOffsetMinutes = getEgyptOffsetMinutes();
  const todayEgypt9PM = Date.UTC(year, month, day, DAILY_REFRESH_HOUR, 0, 0) - egyptOffsetMinutes * 60_000;

  if (egyptHour >= DAILY_REFRESH_HOUR) {
    // We're past 9 PM today — last snapshot was today at 9 PM
    return todayEgypt9PM;
  } else {
    // We're before 9 PM — last snapshot was yesterday at 9 PM
    return todayEgypt9PM - 24 * 60 * 60 * 1000;
  }
}

/** Get Egypt UTC offset in minutes by comparing formatted UTC vs local */
function getEgyptOffsetMinutes(): number {
  const now = new Date();
  // Format a reference time in Egypt and UTC, then compute the diff
  const fmtEgypt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric", minute: "numeric", hour12: false, timeZone: EGYPT_TZ,
  }).format(now);
  const fmtUTC = new Intl.DateTimeFormat("en-US", {
    hour: "numeric", minute: "numeric", hour12: false, timeZone: "UTC",
  }).format(now);

  const [eh, em] = fmtEgypt.split(":").map(Number);
  const [uh, um] = fmtUTC.split(":").map(Number);
  return (eh * 60 + em) - (uh * 60 + um);
}

/** Returns how many minutes until the next 9 PM Egypt time */
function minutesUntilNextEgypt9PM(): number {
  const last9PM = lastEgypt9PMTimestamp();
  const next9PM = last9PM + 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((next9PM - Date.now()) / 60_000));
}

/** True if the cache timestamp is from before the last 9 PM Egypt checkpoint */
function isCacheStale(cachedTs: number): boolean {
  return cachedTs < lastEgypt9PMTimestamp();
}

// ── Storage helpers ───────────────────────────────────────────────────────────
function readCachedSummary(): { data: SummaryData; ts: number } | null {
  try {
    const raw = localStorage.getItem(SUMMARY_CACHE_KEY);
    const ts  = parseInt(localStorage.getItem(SUMMARY_TS_KEY) ?? "0", 10);
    if (!raw || !ts) return null;
    return { data: JSON.parse(raw) as SummaryData, ts };
  } catch {
    return null;
  }
}

function writeCachedSummary(data: SummaryData) {
  try {
    localStorage.setItem(SUMMARY_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(SUMMARY_TS_KEY, String(Date.now()));
  } catch { /* storage full — ignore */ }
}

function formatLastUpdated(ts: number): string {
  const diff  = Date.now() - ts;
  const hours = Math.floor(diff / 3_600_000);
  const mins  = Math.floor((diff % 3_600_000) / 60_000);
  if (hours === 0 && mins < 2) return "الآن";
  if (hours === 0) return `منذ ${mins} دقيقة`;
  if (hours < 24)  return `منذ ${hours} ساعة`;
  return "منذ أكثر من يوم";
}

function formatNextRefresh(): string {
  const mins = minutesUntilNextEgypt9PM();
  if (mins <= 0) return "قريباً";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `بعد ${m} دقيقة`;
  return `بعد ${h}س ${m}د`;
}


// ── Date range helper ────────────────────────────────────────────────────────
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function FinancialPage() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [txData, setTxData]           = useState<TransactionData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [txLoading, setTxLoading]           = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [lastUpdatedTs, setLastUpdatedTs]   = useState<number | null>(null);
  const [, forceRender]                     = useState(0); // to update "منذ X" text

  const [filters, setFilters]     = useState<FiltersType>({ period: "month" });
  const [editRecord, setEditRecord] = useState<DoctorFinancialRecord | null>(null);

  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minuteTickRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const period = currentMonthStr();

  /**
   * FIX 4: activePeriod reflects the selected filter so paid-status is accurate.
   */
  const activePeriod = (() => {
    if (filters.period === "today" || filters.period === "week") return currentMonthStr();
    if (filters.period === "year") return new Date().getFullYear().toString();
    if (filters.period === "custom" && filters.dateFrom) return filters.dateFrom.slice(0, 7);
    return currentMonthStr();
  })();

  // ── Fetch Summary (KPI cards + charts) — respects Egypt 9 PM schedule ───────
  const fetchSummary = useCallback(async (force = false) => {
    if (!force) {
      // Use cache if it was fetched AFTER the last 9 PM Egypt checkpoint
      const cached = readCachedSummary();
      if (cached && !isCacheStale(cached.ts)) {
        setSummaryData(cached.data);
        setLastUpdatedTs(cached.ts);
        setSummaryLoading(false);
        return;
      }
    }

    setSummaryLoading(true);
    try {
      const res  = await fetch("/api/clinic/financial/summary");
      const json = await res.json();
      if (json.success) {
        setSummaryData(json.data);
        writeCachedSummary(json.data);
        setLastUpdatedTs(Date.now());
      } else {
        setError(json.error ?? "خطأ في تحميل الملخص");
      }
    } catch {
      setError("تعذّر الاتصال بالسيرفر");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ── Fetch Transactions / Doctor Records (filtered — always fresh) ──────────
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
      if (f.doctorId)   params.set("doctor_id",  String(f.doctorId));
      if (f.specialist) params.set("specialist",  f.specialist);
      params.set("period", activePeriod);

      const res  = await fetch(`/api/clinic/financial/transactions?${params}`);
      const json = await res.json();
      if (json.success) setTxData(json.data);
      else setError(json.error ?? "خطأ في تحميل البيانات");
    } catch {
      setError("تعذّر الاتصال بالسيرفر");
    } finally {
      setTxLoading(false);
    }
  }, [activePeriod]);

  // ── On mount: load summary (from cache or fetch) + set up 24h auto-refresh ─
  useEffect(() => {
    // Initial load (uses cache if fresh)
    fetchSummary(false);

    // Check every hour if 24h have passed
    checkIntervalRef.current = setInterval(() => {
      const cached = readCachedSummary();
      if (!cached || Date.now() - cached.ts >= REFRESH_INTERVAL_MS) {
        void fetchSummary(true);
      }
    }, CHECK_INTERVAL_MS);

    // Update "منذ X دقيقة" display every minute
    minuteTickRef.current = setInterval(() => forceRender((n) => n + 1), 60_000);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (minuteTickRef.current)    clearInterval(minuteTickRef.current);
    };
  }, [fetchSummary]);

  // Refetch transactions whenever filters change
  useEffect(() => {
    void fetchTransactions(filters);
  }, [filters, fetchTransactions]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSavePercentage = async (doctorId: string | number, percentage: number) => {
    await fetch("/api/clinic/financial/profit-sharing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_id: doctorId, doctorPercentage: percentage }),
    });
    // Profit-sharing change affects both — force-refresh summary (bypass cache)
    void fetchSummary(true);
    void fetchTransactions(filters);
  };

  const handleMarkPaid = async (doctorId: string | number, p: string, paid: boolean) => {
    await fetch("/api/clinic/financial/mark-paid", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_id: doctorId, period: p, paid }),
    });
    void fetchSummary(true);
    void fetchTransactions(filters);
  };

  const handleReset = () => setFilters({ period: "month" });

  // Manual refresh — always bypasses cache
  const handleRefresh = () => {
    void fetchSummary(true);
    void fetchTransactions(filters);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const doctorOptions =
    txData?.doctorRecords.map((r) => ({ id: r.doctorId, name: r.doctorName })) ?? [];
  const specialists = txData?.specialties ?? [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
              <TrendingUp size={16} className="text-teal-400" />
            </span>
            <h1 className="text-xl font-bold text-(--text-primary)">الإدارة المالية</h1>
          </div>
          <p className="text-sm text-(--text-secondary) pr-10">
            إيرادات وتوزيع الأرباح بين العيادة والأطباء
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <ExportButtons records={txData?.doctorRecords ?? []} period={period} />

          {/* Schedule info pills */}
          <div className="hidden sm:flex items-center gap-2">
            {lastUpdatedTs && (
              <span className="flex items-center gap-1.5 text-xs text-(--text-secondary) bg-(--semi-card-bg) px-3 py-1.5 rounded-xl border border-(--card-border)">
                <Clock size={11} />
                آخر تحديث: {formatLastUpdated(lastUpdatedTs)}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 bg-teal-500/8 px-3 py-1.5 rounded-xl border border-teal-500/20">
              <Clock size={11} />
              التحديث القادم: الساعة 9م · {formatNextRefresh()}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={summaryLoading || txLoading}
            className="p-2 rounded-xl border border-(--card-border) bg-(--card-bg) text-(--text-secondary) hover:text-teal-400 hover:border-teal-500/40 transition-all shadow-[var(--shadow-soft)] disabled:opacity-50"
            title="تحديث البيانات الآن (يتجاوز الجدولة)"
          >
            <RefreshCw size={15} className={summaryLoading || txLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>


      {/* ── Error Banner ── */}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-400 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="mr-auto text-xs underline hover:no-underline"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* ── Overview Cards ── */}
      <FinancialOverviewCards summary={summaryData?.summary ?? null} loading={summaryLoading} />

      {/* ── Charts ── */}
      <RevenueCharts
        daily={summaryData?.daily ?? []}
        monthly={summaryData?.monthly ?? []}
        doctorRecords={txData?.doctorRecords ?? []}
        clinicProfit={summaryData?.summary.clinicProfit ?? 0}
        doctorsTotalEarnings={summaryData?.summary.doctorsTotalEarnings ?? 0}
        loading={summaryLoading}
      />

      {/* ── Filters ── */}
      <FinancialFilters
        specialists={specialists}
        doctorOptions={doctorOptions}
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleReset}
      />

      {/* ── Doctor Earnings Table ── */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold text-(--text-primary)">إيرادات الأطباء</h2>
            <p className="text-xs text-(--text-secondary) mt-0.5">
              {txData?.doctorRecords.length ?? 0} طبيب — قابل للتعديل والفرز
            </p>
          </div>
          <span className="text-xs text-(--text-secondary) bg-(--semi-card-bg) px-3 py-1 rounded-full border border-(--card-border)">
            الفترة: {activePeriod}
          </span>
        </div>

        <DoctorEarningsTable
          records={txData?.doctorRecords ?? []}
          loading={txLoading}
          period={activePeriod}
          onEditPercentage={setEditRecord}
          onMarkPaid={handleMarkPaid}
        />
      </div>

      {/* ── Profit Sharing Modal ── */}
      <ProfitSharingModal
        record={editRecord}
        onClose={() => setEditRecord(null)}
        onSave={handleSavePercentage}
      />
    </div>
  );
}


