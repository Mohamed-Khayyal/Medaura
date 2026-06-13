"use client";

import { useState } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import type { FinancialFilters } from "@/app/clinicDash/financial/lib/types";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

interface Props {
  filters: FinancialFilters;
  onFiltersChange: (filters: FinancialFilters) => void;
  onReset: () => void;
}

export default function FinancialFilters({
  filters,
  onFiltersChange,
  onReset,
}: Props) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [showCustom, setShowCustom] = useState(filters.period === "custom");

  const periodOptions: { label: string; value: FinancialFilters["period"] }[] = [
    { label: t("financialPage.today", locale), value: "today" },
    { label: t("financialPage.week", locale), value: "week" },
    { label: t("financialPage.month", locale), value: "month" },
    { label: t("financialPage.year", locale), value: "year" },
    { label: t("financialPage.custom", locale), value: "custom" },
  ];

  const handlePeriodChange = (period: FinancialFilters["period"]) => {
    const isCustom = period === "custom";
    setShowCustom(isCustom);
    if (!isCustom) {
      onFiltersChange({ ...filters, period, dateFrom: undefined, dateTo: undefined });
    } else {
      onFiltersChange({ ...filters, period });
    }
  };

  const hasActiveFilters = filters.period !== "month";

  return (
    <div
      className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-4 space-y-4 shadow-[var(--shadow-soft)]"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-(--text-secondary) flex items-center gap-1.5 shrink-0">
          <Calendar size={13} />
          {t("financialPage.timePeriod", locale)}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handlePeriodChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filters.period === opt.value
                  ? "bg-teal-500 text-white shadow-sm shadow-teal-500/30"
                  : "bg-(--semi-card-bg) text-(--text-secondary) hover:bg-(--hover-bg) hover:text-(--text-primary)"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="mr-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <RefreshCw size={12} />
            {t("financialPage.reset", locale)}
          </button>
        )}
      </div>

      {showCustom && (
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-(--text-secondary) shrink-0">{t("financialPage.dateFrom", locale)}</label>
            <input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })
              }
              className="px-3 py-1.5 rounded-xl border border-(--card-border) bg-(--input-bg) text-(--text-primary) text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-(--text-secondary) shrink-0">{t("financialPage.dateTo", locale)}</label>
            <input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, dateTo: e.target.value || undefined })
              }
              className="px-3 py-1.5 rounded-xl border border-(--card-border) bg-(--input-bg) text-(--text-primary) text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}
