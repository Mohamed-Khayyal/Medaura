"use client";

import { Download, Printer, FileSpreadsheet } from "lucide-react";
import type { AppointmentRecord } from "@/app/clinicDash/financial/lib/types";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

interface Props {
  records: AppointmentRecord[];
  period: string; // e.g. "2025-06"
}

export default function ExportButtons({ records, period }: Props) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const handleCSV = () => {
    if (records.length === 0) return;
    
    const headers = [
      t("financialPage.patient", locale),
      t("financialPage.date", locale),
      t("financialPage.consultationFee", locale),
      t("financialPage.yourSharePct", locale),
      t("financialPage.yourEarnings", locale),
      t("financialPage.status", locale)
    ];

    const rows = records.map((r) => [
      r.patientName,
      r.bookingDate,
      r.consultationFee,
      r.doctorPercentage,
      r.paymentStatus === "paid" ? r.doctorShare : 0,
      t("financialPage." + r.paymentStatus, locale)
    ]);

    const reportTitle = isRtl ? "تقرير الأرباح المالية" : "Financial Earnings Report";
    const csv = [
      `${reportTitle} — ${period}`,
      "",
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const BOM = "\uFEFF"; // UTF-8 BOM for Arabic Excel compatibility
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2 flex-wrap" dir={isRtl ? "rtl" : "ltr"}>
      <button
        onClick={handleCSV}
        disabled={records.length === 0}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-(--card-border) bg-(--card-bg) text-(--text-secondary) text-xs font-semibold hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-[var(--shadow-soft)]"
        title={t("financialPage.exportCsv", locale)}
      >
        <FileSpreadsheet size={14} />
        {t("financialPage.exportCsv", locale)}
      </button>

      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-(--card-border) bg-(--card-bg) text-(--text-secondary) text-xs font-semibold hover:bg-blue-500/10 hover:border-blue-500/40 hover:text-blue-500 transition-all duration-200 shadow-[var(--shadow-soft)]"
        title={t("financialPage.printPdf", locale)}
      >
        <Printer size={14} />
        {t("financialPage.printPdf", locale)}
      </button>

      <button
        onClick={handleCSV}
        disabled={records.length === 0}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-teal-500/30"
        title={t("financialPage.downloadReport", locale)}
      >
        <Download size={14} />
        {t("financialPage.downloadReport", locale)}
      </button>
    </div>
  );
}
