"use client";

import { useState } from "react";
import { CheckCircle, Clock, User, ChevronUp, ChevronDown, XCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/app/clinicDash/financial/lib/calculations";
import type { AppointmentRecord } from "@/app/clinicDash/financial/lib/types";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";


interface Props {
  records: AppointmentRecord[];
  loading: boolean;
  onRefresh?: () => void;
}

type SortKey = "patientName" | "bookingDate" | "consultationFee" | "paymentStatus";

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-(--semi-card-bg) animate-pulse" />
      ))}
    </div>
  );
}

const STATUS_BADGE = {
  paid: {
    wrapper: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    Icon: CheckCircle,
    label: "مدفوع",
  },
  pending: {
    wrapper: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Icon: Clock,
    label: "معلق",
  },
  cancelled: {
    wrapper: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    Icon: XCircle,
    label: "ملغي",
  },
} as const;

export default function DoctorEarningsTable({ records, loading, onRefresh }: Props) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [sortKey, setSortKey] = useState<SortKey>("bookingDate");
  const [sortAsc, setSortAsc] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | number | null>(null);

  const handleConfirmPayment = async (bookingId: string | number) => {
    setConfirmingId(bookingId);
    try {
      const res = await fetch("/api/doctor/financial/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (data.success) {
        if (onRefresh) onRefresh();
      } else {
        alert(data.error ?? "Failed to confirm payment");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while confirming payment");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...records].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === "string" && typeof valB === "string") {
      return sortAsc ? valA.localeCompare(valB, locale) : valB.localeCompare(valA, locale);
    }
    return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
  });

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp size={12} className="opacity-20" />;
    return sortAsc
      ? <ChevronUp size={12} className="text-teal-500" />
      : <ChevronDown size={12} className="text-teal-500" />;
  };

  const cols: { label: string; key?: SortKey; align?: string }[] = [
    { label: t("financialPage.patient", locale),          key: "patientName"       },
    { label: t("financialPage.date", locale),             key: "bookingDate",       align: "text-center" },
    { label: t("financialPage.consultationFee", locale),  key: "consultationFee",   align: "text-center" },
    { label: t("financialPage.yourSharePct", locale),     align: "text-center" },
    { label: t("financialPage.yourEarnings", locale),     align: "text-center"     },
    { label: t("financialPage.status", locale),           key: "paymentStatus",     align: "text-center" },
  ];

  const paidRecs      = records.filter((r) => r.paymentStatus === "paid");
  const pendingRecs   = records.filter((r) => r.paymentStatus === "pending");
  const cancelledRecs = records.filter((r) => r.paymentStatus === "cancelled");
  const totalRevenue  = paidRecs.reduce((s, r) => s + r.consultationFee, 0);
  const totalDocShare = paidRecs.reduce((s, r) => s + r.doctorShare, 0);

  if (loading) return <Skeleton />;

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-(--semi-card-bg) flex items-center justify-center">
          <User size={28} className="text-(--text-secondary)" />
        </div>
        <div className="text-center">
          <p className="text-(--text-secondary) text-sm font-medium">
            {t("financialPage.noAppointments", locale)}
          </p>
          <p className="text-(--text-secondary) text-xs opacity-60 mt-1">
            {t("financialPage.noAppointmentsDesc", locale)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 font-medium">
          <CheckCircle size={11} />
          {t("financialPage.paid", locale)}: {paidRecs.length} {t("financialPage.appointments", locale)} &nbsp;·&nbsp; {t("financialPage.yourEarnings", locale)}: {formatCurrency(totalDocShare)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/20 font-medium">
          <Clock size={11} />
          {t("financialPage.pending", locale)}: {pendingRecs.length} {t("financialPage.appointments", locale)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-full border border-rose-500/20 font-medium">
          <XCircle size={11} />
          {t("financialPage.cancelled", locale)}: {cancelledRecs.length} {t("financialPage.appointments", locale)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs bg-(--semi-card-bg) text-(--text-secondary) px-3 py-1.5 rounded-full border border-(--card-border) font-medium">
          <AlertCircle size={11} />
          {t("financialPage.total", locale)}: {records.length} {t("financialPage.appointments", locale)}
        </span>
      </div>

      {/* Mobile view */}
      <div className="sm:hidden grid grid-cols-1 gap-3 mb-4">
        {sorted.map((rec) => {
          const badge = STATUS_BADGE[rec.paymentStatus];
          const { Icon } = badge;
          const label = t("financialPage." + rec.paymentStatus, locale);
          const isCancelled = rec.paymentStatus === "cancelled";
          const isPaid      = rec.paymentStatus === "paid";

          return (
            <div key={rec.bookingId} className={`rounded-2xl border border-(--card-border) bg-(--card-bg) p-4 space-y-3 ${isCancelled ? "opacity-55" : ""}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-(--text-primary)">{rec.patientName}</p>
                  <p className="text-xs text-(--text-secondary) mt-0.5">{rec.bookingDate} {rec.bookingFrom !== "—" ? rec.bookingFrom : ""}</p>
                </div>
                <span className={badge.wrapper}>
                  <Icon size={11} />
                  {label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                <div>
                  <p className="text-(--text-secondary) mb-0.5">{t("financialPage.consultationFee", locale)}</p>
                  <p className="font-medium text-(--text-primary)">{formatCurrency(rec.consultationFee)}</p>
                </div>
                <div>
                  <p className="text-(--text-secondary) mb-0.5">{t("financialPage.yourSharePct", locale)}</p>
                  <p className="font-medium text-amber-500">{rec.doctorPercentage}%</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-(--card-border) flex items-center justify-between">
                  <div>
                    <p className="text-(--text-secondary) mb-0.5">{t("financialPage.yourEarnings", locale)}</p>
                    <p className="font-bold text-sm text-emerald-500">{isPaid ? formatCurrency(rec.doctorShare) : "—"}</p>
                  </div>
                  {!isPaid && rec.paymentStatus === "pending" && (
                    <button
                      disabled={confirmingId === rec.bookingId}
                      onClick={() => handleConfirmPayment(rec.bookingId)}
                      className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-[11px] font-bold transition-all disabled:opacity-50"
                    >
                      {confirmingId === rec.bookingId ? "..." : t("financialPage.confirmPayment", locale)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop view */}
      <div className="hidden sm:block overflow-x-auto -mx-1">
        <table className="w-full text-sm min-w-[700px]" dir={isRtl ? "rtl" : "ltr"}>
          <thead>
            <tr className="border-b border-(--card-border)">
              {cols.map((col, i) => (
                <th
                  key={`${col.label}-${i}`}
                  className={`px-4 py-3 text-xs font-semibold text-(--text-secondary) uppercase tracking-wide whitespace-nowrap ${
                    col.align ?? (isRtl ? "text-right" : "text-left")
                  }`}
                >
                  {col.key ? (
                    <button
                      onClick={() => handleSort(col.key!)}
                      className="inline-flex items-center gap-1 hover:text-(--text-primary) transition-colors"
                    >
                      {col.label}
                      <SortIcon k={col.key} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-(--card-border)">
            {sorted.map((rec) => {
              const badge = STATUS_BADGE[rec.paymentStatus];
              const { Icon } = badge;
              const label = t("financialPage." + rec.paymentStatus, locale);
              const isCancelled = rec.paymentStatus === "cancelled";
              const isPaid      = rec.paymentStatus === "paid";

              return (
                <tr
                  key={rec.bookingId}
                  className={`group transition-colors duration-150 ${
                    isCancelled ? "opacity-55 bg-rose-500/[0.02]" : "hover:bg-(--semi-card-bg)"
                  }`}
                >
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-medium text-sm text-(--text-primary)">
                      {rec.patientName}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <p className="text-xs font-medium text-(--text-primary)">
                      {rec.bookingDate}
                    </p>
                    {rec.bookingFrom !== "—" && (
                      <p className="text-[11px] text-(--text-secondary)">{rec.bookingFrom}</p>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap text-sm font-semibold">
                    {formatCurrency(rec.consultationFee)}
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {rec.doctorPercentage}%
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {isPaid ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(rec.doctorShare)}
                      </span>
                    ) : (
                      <span className="text-(--text-secondary) opacity-40 text-xs">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className={badge.wrapper}>
                        <Icon size={11} />
                        {label}
                      </span>
                      {rec.paymentStatus === "pending" && (
                        <button
                          disabled={confirmingId === rec.bookingId}
                          onClick={() => handleConfirmPayment(rec.bookingId)}
                          className="text-[10px] font-bold text-teal-500 hover:text-teal-600 hover:underline disabled:opacity-50"
                        >
                          {confirmingId === rec.bookingId ? "..." : t("financialPage.confirmPayment", locale)}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-(--card-border) bg-(--semi-card-bg)">
              <td className="px-4 py-3 font-bold text-(--text-primary) text-sm" colSpan={2}>
                {t("financialPage.totalEarnedReceived", locale)} ({paidRecs.length} {t("financialPage.appointments", locale)})
              </td>
              <td className="px-4 py-3 text-center font-bold text-(--text-secondary)">
                {formatCurrency(totalRevenue)}
              </td>
              <td className="px-4 py-3 text-center">—</td>
              <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatCurrency(totalDocShare)}
              </td>
              <td className="px-4 py-3 text-center">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
