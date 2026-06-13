"use client";

import { useState } from "react";
import {
  Edit3, CheckCircle, Clock, User, ChevronUp, ChevronDown,
  XCircle, AlertCircle, Stethoscope,
} from "lucide-react";
import { formatCurrency } from "../lib/calculations";
import type { AppointmentRecord, DoctorFinancialRecord } from "../lib/types";

interface Props {
  records: AppointmentRecord[];
  /** Doctor-level records, used to open the profit-sharing modal */
  doctorRecords: DoctorFinancialRecord[];
  loading: boolean;
  period: string;
  onEditPercentage: (record: DoctorFinancialRecord) => void;
  onMarkPaid: (bookingId: string | number, status: "paid" | "cancelled") => Promise<void>;
}

type SortKey =
  | "patientName"
  | "doctorName"
  | "bookingDate"
  | "consultationFee"
  | "paymentStatus";

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-(--semi-card-bg) animate-pulse" />
      ))}
    </div>
  );
}

// ── Status badge config ───────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
export default function DoctorEarningsTable({
  records,
  doctorRecords,
  loading,
  period,
  onEditPercentage,
  onMarkPaid,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("bookingDate");
  const [sortAsc, setSortAsc] = useState(false);
  const [processingId, setProcessingId] = useState<string | number | null>(null);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sorted = [...records].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === "string" && typeof valB === "string") {
      return sortAsc ? valA.localeCompare(valB, "ar") : valB.localeCompare(valA, "ar");
    }
    return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
  });

  // ── Toggle payment status ──────────────────────────────────────────────────
  const handleToggle = async (rec: AppointmentRecord) => {
    setProcessingId(rec.bookingId);
    try {
      const next = rec.paymentStatus === "paid" ? "cancelled" : "paid";
      await onMarkPaid(rec.bookingId, next);
    } finally {
      setProcessingId(null);
    }
  };

  // ── Open profit-sharing modal for this booking's doctor ───────────────────
  const handleEditDoctor = (rec: AppointmentRecord) => {
    const docRecord = doctorRecords.find(
      (d) => String(d.doctorId) === String(rec.doctorId)
    );
    if (docRecord) {
      onEditPercentage(docRecord);
    }
  };

  // ── Sort icon ──────────────────────────────────────────────────────────────
  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp size={12} className="opacity-20" />;
    return sortAsc
      ? <ChevronUp size={12} className="text-teal-500" />
      : <ChevronDown size={12} className="text-teal-500" />;
  };

  // ── Column definitions ─────────────────────────────────────────────────────
  const cols: { label: string; key?: SortKey; align?: string }[] = [
    { label: "المريض",          key: "patientName"       },
    { label: "الطبيب",          key: "doctorName"        },
    { label: "التاريخ",         key: "bookingDate",       align: "text-center" },
    { label: "سعر الاستشارة",  key: "consultationFee",   align: "text-center" },
    { label: "% الطبيب",        align: "text-center"     },
    { label: "% العيادة",       align: "text-center"     },
    { label: "حصة الطبيب",     align: "text-center"     },
    { label: "حصة العيادة",    align: "text-center"     },
    { label: "الحالة",          key: "paymentStatus",     align: "text-center" },
    { label: "إجراء",           align: "text-center"     },
  ];

  // ── Derived summary stats (paid only) ─────────────────────────────────────
  const paidRecs      = records.filter((r) => r.paymentStatus === "paid");
  const pendingRecs   = records.filter((r) => r.paymentStatus === "pending");
  const cancelledRecs = records.filter((r) => r.paymentStatus === "cancelled");
  const totalRevenue  = paidRecs.reduce((s, r) => s + r.consultationFee, 0);
  const totalDocShare = paidRecs.reduce((s, r) => s + r.doctorShare, 0);
  const totalCliShare = paidRecs.reduce((s, r) => s + r.clinicShare, 0);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) return <Skeleton />;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-(--semi-card-bg) flex items-center justify-center">
          <User size={28} className="text-(--text-secondary)" />
        </div>
        <div className="text-center">
          <p className="text-(--text-secondary) text-sm font-medium">
            لا توجد مواعيد في هذه الفترة
          </p>
          <p className="text-(--text-secondary) text-xs opacity-60 mt-1">
            تظهر البيانات عند وجود مواعيد مسجلة
          </p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Summary pills ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 font-medium">
          <CheckCircle size={11} />
          مدفوع: {paidRecs.length} موعد &nbsp;·&nbsp; {formatCurrency(totalRevenue)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/20 font-medium">
          <Clock size={11} />
          معلق: {pendingRecs.length} موعد
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-full border border-rose-500/20 font-medium">
          <XCircle size={11} />
          ملغي: {cancelledRecs.length} موعد
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs bg-(--semi-card-bg) text-(--text-secondary) px-3 py-1.5 rounded-full border border-(--card-border) font-medium">
          <AlertCircle size={11} />
          الإجمالي: {records.length} موعد
        </span>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm min-w-[1050px]" dir="rtl">
          <thead>
            <tr className="border-b border-(--card-border)">
              {cols.map((col, i) => (
                <th
                  key={`${col.label}-${i}`}
                  className={`px-4 py-3 text-xs font-semibold text-(--text-secondary) uppercase tracking-wide whitespace-nowrap ${col.align ?? "text-right"}`}
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
            {sorted.map((rec, idx) => {
              const badge = STATUS_BADGE[rec.paymentStatus];
              const { Icon } = badge;
              const isCancelled = rec.paymentStatus === "cancelled";
              const isPaid      = rec.paymentStatus === "paid";
              const isProcessing = processingId === rec.bookingId;

              return (
                <tr
                  key={rec.bookingId}
                  className={`group transition-colors duration-150 ${
                    isCancelled
                      ? "opacity-55 bg-rose-500/[0.02]"
                      : "hover:bg-(--semi-card-bg)"
                  }`}
                  style={{
                    animation: "fadeUp 0.3s ease both",
                    animationDelay: `${idx * 30}ms`,
                  }}
                >
                  {/* ── Patient ── */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <User size={13} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <span
                        className={`font-medium text-sm ${
                          isCancelled
                            ? "line-through text-(--text-secondary)"
                            : "text-(--text-primary)"
                        }`}
                      >
                        {rec.patientName}
                      </span>
                    </div>
                  </td>

                  {/* ── Doctor ── */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                        <Stethoscope size={13} className="text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-(--text-primary) text-sm leading-tight">
                          {rec.doctorName}
                        </p>
                        <p className="text-[11px] text-(--text-secondary)">
                          {rec.specialist}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ── Date / Time ── */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <p className="text-xs font-medium text-(--text-primary)">
                      {rec.bookingDate}
                    </p>
                    {rec.bookingFrom !== "—" && (
                      <p className="text-[11px] text-(--text-secondary)">{rec.bookingFrom}</p>
                    )}
                  </td>

                  {/* ── Consultation Fee ── */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span
                      className={`font-bold ${
                        isPaid ? "text-(--text-primary)" : "text-(--text-secondary)"
                      }`}
                    >
                      {formatCurrency(rec.consultationFee)}
                    </span>
                  </td>

                  {/* ── Doctor % ── */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-14 h-1.5 rounded-full bg-(--semi-card-bg) overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${rec.doctorPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {rec.doctorPercentage}%
                      </span>
                    </div>
                  </td>

                  {/* ── Clinic % ── */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-14 h-1.5 rounded-full bg-(--semi-card-bg) overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-400 transition-all duration-500"
                          style={{ width: `${rec.clinicPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                        {rec.clinicPercentage}%
                      </span>
                    </div>
                  </td>

                  {/* ── Doctor Share ── */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {isPaid ? (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {formatCurrency(rec.doctorShare)}
                      </span>
                    ) : (
                      <span className="text-(--text-secondary) opacity-40 text-xs">—</span>
                    )}
                  </td>

                  {/* ── Clinic Share ── */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {isPaid ? (
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {formatCurrency(rec.clinicShare)}
                      </span>
                    ) : (
                      <span className="text-(--text-secondary) opacity-40 text-xs">—</span>
                    )}
                  </td>

                  {/* ── Payment Status ── */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className={badge.wrapper}>
                      <Icon size={11} />
                      {badge.label}
                    </span>
                  </td>

                  {/* ── Actions ── */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      {/* Edit doctor profit share */}
                      <button
                        onClick={() => handleEditDoctor(rec)}
                        className="p-1.5 rounded-lg hover:bg-(--hover-bg) text-(--text-secondary) hover:text-teal-500 transition-colors"
                        title="تعديل نسبة أرباح الطبيب"
                      >
                        <Edit3 size={14} />
                      </button>

                      {/* Toggle paid / cancelled (disabled for auto-cancelled) */}
                      {isCancelled ? (
                        <span className="text-xs text-(--text-secondary) opacity-40 px-1">—</span>
                      ) : (
                        <button
                          onClick={() => handleToggle(rec)}
                          disabled={isProcessing}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                            isPaid
                              ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-200"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200"
                          }`}
                        >
                          {isProcessing ? (
                            <span className="w-3 h-3 rounded-full border-2 border-current/30 border-t-current animate-spin inline-block" />
                          ) : isPaid ? (
                            "إلغاء الدفع"
                          ) : (
                            "تحديد كمدفوع"
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* ── Totals footer — paid appointments only ── */}
          <tfoot>
            <tr className="border-t-2 border-(--card-border) bg-(--semi-card-bg)">
              <td
                className="px-4 py-3 font-bold text-(--text-primary) text-sm"
                colSpan={3}
              >
                إجمالي المدفوعات ({paidRecs.length} موعد)
              </td>
              <td className="px-4 py-3 text-center font-bold text-(--text-primary)">
                {formatCurrency(totalRevenue)}
              </td>
              <td className="px-4 py-3 text-center">—</td>
              <td className="px-4 py-3 text-center">—</td>
              <td className="px-4 py-3 text-center font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(totalDocShare)}
              </td>
              <td className="px-4 py-3 text-center font-bold text-teal-600 dark:text-teal-400">
                {formatCurrency(totalCliShare)}
              </td>
              <td className="px-4 py-3 text-center">—</td>
              <td className="px-4 py-3 text-center">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
