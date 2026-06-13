"use client";

import { CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react";
import { formatCurrency } from "../lib/calculations";
import type { AppointmentRecord } from "../lib/types";

interface Props {
  records: AppointmentRecord[];
  loading: boolean;
  onMarkPayment: (bookingId: string | number, status: "paid" | "cancelled" | "pending") => void;
}

const STATUS_CONFIG = {
  paid: {
    label: "مدفوع",
    icon: <CheckCircle size={12} />,
    className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  cancelled: {
    label: "ملغي",
    icon: <XCircle size={12} />,
    className: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
  pending: {
    label: "في الانتظار",
    icon: <Clock size={12} />,
    className: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
};

function Skeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 rounded-xl bg-(--semi-card-bg) animate-pulse" />
      ))}
    </div>
  );
}

export default function PendingAppointmentsTable({ records, loading, onMarkPayment }: Props) {
  if (loading) return <Skeleton />;

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-(--text-secondary)">
        <CheckCircle size={32} className="text-emerald-400 opacity-60" />
        <p className="text-sm font-medium">لا توجد مواعيد مكتملة في هذه الفترة</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" dir="rtl">
        <thead>
          <tr className="border-b border-(--card-border) text-(--text-secondary) text-xs">
            <th className="text-right py-3 px-3 font-semibold">المريض</th>
            <th className="text-right py-3 px-3 font-semibold">الطبيب</th>
            <th className="text-right py-3 px-3 font-semibold">التاريخ</th>
            <th className="text-right py-3 px-3 font-semibold">رسوم الكشف</th>
            <th className="text-right py-3 px-3 font-semibold">حصة الطبيب</th>
            <th className="text-right py-3 px-3 font-semibold">حصة العيادة</th>
            <th className="text-right py-3 px-3 font-semibold">حالة الدفع</th>
            <th className="text-right py-3 px-3 font-semibold">إجراء</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-(--card-border)">
          {records.map((r) => {
            const st = STATUS_CONFIG[r.paymentStatus];
            return (
              <tr
                key={String(r.bookingId)}
                className={`transition-colors hover:bg-(--hover-bg) ${
                  r.paymentStatus === "cancelled" ? "opacity-50" : ""
                }`}
              >
                {/* Patient */}
                <td className="py-3 px-3 text-(--text-primary) font-medium">
                  {r.patientName}
                </td>
                {/* Doctor */}
                <td className="py-3 px-3 text-(--text-secondary)">
                  <div>{r.doctorName}</div>
                  <div className="text-[10px] text-(--text-secondary) opacity-60">{r.specialist}</div>
                </td>
                {/* Date */}
                <td className="py-3 px-3 text-(--text-secondary) tabular-nums text-xs">
                  {r.bookingDate}
                  {r.bookingFrom !== "—" && (
                    <span className="block text-[10px] opacity-60">{r.bookingFrom}</span>
                  )}
                </td>
                {/* Fee */}
                <td className="py-3 px-3 text-(--text-primary) font-semibold tabular-nums">
                  {formatCurrency(r.consultationFee)}
                </td>
                {/* Doctor share */}
                <td className="py-3 px-3 text-amber-500 tabular-nums text-xs">
                  {r.paymentStatus !== "cancelled" ? formatCurrency(r.doctorShare) : "—"}
                </td>
                {/* Clinic share */}
                <td className="py-3 px-3 text-teal-500 tabular-nums text-xs">
                  {r.paymentStatus !== "cancelled" ? formatCurrency(r.clinicShare) : "—"}
                </td>
                {/* Status badge */}
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.className}`}
                  >
                    {st.icon}
                    {st.label}
                  </span>
                </td>
                {/* Actions */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    {r.paymentStatus !== "paid" && r.paymentStatus !== "cancelled" && (
                      <>
                        {/* Confirm payment */}
                        <button
                          onClick={() => onMarkPayment(r.bookingId, "paid")}
                          title="تأكيد دفع المريض"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                        >
                          <CheckCircle size={11} />
                          تأكيد
                        </button>
                        {/* Cancel */}
                        <button
                          onClick={() => onMarkPayment(r.bookingId, "cancelled")}
                          title="إلغاء الموعد"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                        >
                          <XCircle size={11} />
                          إلغاء
                        </button>
                      </>
                    )}
                    {(r.paymentStatus === "paid" || r.paymentStatus === "cancelled") && (
                      /* Reset to pending */
                      <button
                        onClick={() => onMarkPayment(r.bookingId, "pending")}
                        title="إعادة تعيين"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-(--text-secondary) bg-(--semi-card-bg) hover:bg-(--hover-bg) border border-(--card-border) transition-colors"
                      >
                        <RotateCcw size={11} />
                        إعادة
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
