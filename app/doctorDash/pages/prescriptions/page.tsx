"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Pill,
  Stethoscope,
  FlaskConical,
  StickyNote,
  Calendar,
  User,
} from "lucide-react";
import type { Prescription } from "@/lib/types/api";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PrescriptionCard({ rx }: { rx: Prescription }) {
  return (
    <div className="bg-(--card-bg) border border-(--card-border) rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 text-right">
          <p className="text-sm text-(--text-secondary)">رقم الروشتة</p>
          <p className="font-bold text-(--text-primary) text-lg">
            #{rx.prescription_id || rx.id}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm text-(--text-secondary)">تاريخ الإنشاء</p>
          <p className="text-sm font-medium text-(--text-primary)">
            {formatDate(rx.created_at)}
          </p>
        </div>
      </div>

      <div className="border-t border-(--card-border)/60" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Patient */}
        {rx.patient_name && (
          <div className="flex items-center gap-2 text-right flex-row-reverse">
            <User size={15} className="text-(--text-secondary) shrink-0" />
            <div>
              <p className="text-xs text-(--text-secondary)">المريض</p>
              <p className="text-sm font-medium text-(--text-primary)">{rx.patient_name}</p>
            </div>
          </div>
        )}

        {/* Visit date */}
        {rx.booking_date && (
          <div className="flex items-center gap-2 text-right flex-row-reverse">
            <Calendar size={15} className="text-(--text-secondary) shrink-0" />
            <div>
              <p className="text-xs text-(--text-secondary)">تاريخ الزيارة</p>
              <p className="text-sm font-medium text-(--text-primary)">
                {formatDate(rx.booking_date)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Medical details */}
      <div className="space-y-2.5">
        {rx.symptoms && (
          <div className="rounded-xl bg-(--semi-card-bg) p-3 text-right">
            <p className="text-xs font-semibold text-(--text-secondary) mb-1">الأعراض</p>
            <p className="text-sm text-(--text-primary)">{rx.symptoms}</p>
          </div>
        )}
        {rx.diagnosis && (
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 text-right">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center justify-end gap-1">
              <Stethoscope size={12} />
              التشخيص
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-200">{rx.diagnosis}</p>
          </div>
        )}
        {rx.medication_name && (
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-right">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center justify-end gap-1">
              <Pill size={12} />
              الدواء
            </p>
            <p className="text-sm text-green-900 dark:text-green-200">
              {rx.medication_name}
              {rx.dose && <span className="text-green-600 dark:text-green-400"> — {rx.dose}</span>}
              {rx.duration && (
                <span className="text-green-600 dark:text-green-400"> لمدة {rx.duration}</span>
              )}
            </p>
          </div>
        )}
        {rx.test_name && (
          <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-3 text-right">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1 flex items-center justify-end gap-1">
              <FlaskConical size={12} />
              الفحوصات
            </p>
            <p className="text-sm text-purple-900 dark:text-purple-200">
              {rx.test_name}
              {rx.test_result && (
                <span className="text-purple-600 dark:text-purple-400"> — {rx.test_result}</span>
              )}
            </p>
          </div>
        )}
        {rx.notes && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-right">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center justify-end gap-1">
              <StickyNote size={12} />
              ملاحظات
            </p>
            <p className="text-sm text-amber-900 dark:text-amber-200">{rx.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const pageSize = 6;

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/prescriptions/my-prescriptions", {
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "فشل تحميل الروشتات");
        return;
      }

      setPrescriptions(Array.isArray(result.data) ? result.data : []);
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const filtered = prescriptions.filter((rx) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      rx.patient_name?.toLowerCase().includes(q) ||
      rx.diagnosis?.toLowerCase().includes(q) ||
      rx.medication_name?.toLowerCase().includes(q) ||
      String(rx.prescription_id || rx.id).includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <FileText size={13} />
            {prescriptions.length} روشتة
          </span>
        </div>
        <div className="text-right">
          <h1 className="font-bold text-2xl text-(--text-primary)">
            الروشتات الطبية
          </h1>
          <p className="text-sm text-(--text-secondary) mt-1">
            قائمة جميع الروشتات الطبية التي كتبتها
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="ابحث باسم المريض أو التشخيص أو الدواء..."
          dir="rtl"
          className="w-full rounded-2xl border border-(--input-border) bg-(--input-bg) px-5 py-3 text-sm text-(--text-primary) outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 transition"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-(--text-secondary)">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p>جارٍ تحميل الروشتات...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-center text-red-700 dark:text-red-400">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-(--text-secondary)">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">
            {searchQuery ? "لا توجد نتائج للبحث" : "لم تكتب أي روشتة بعد"}
          </p>
          <p className="text-sm mt-2 opacity-70">
            {searchQuery
              ? "جرب كلمات بحث مختلفة"
              : "ستظهر الروشتات هنا عند كتابتها من قائمة الحجوزات"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginated.map((rx) => (
              <div
                key={rx.prescription_id || rx.id}
                className="cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => setSelected(rx)}
              >
                <PrescriptionCard rx={rx} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex items-center justify-center border border-(--input-border) rounded-lg p-2 hover:bg-(--semi-card-bg) transition disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
                    p === page
                      ? "bg-[#1F2B6C] text-white"
                      : "border border-(--input-border) hover:bg-(--semi-card-bg) text-(--text-primary)"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="flex items-center justify-center border border-(--input-border) rounded-lg p-2 hover:bg-(--semi-card-bg) transition disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-[#1a2744] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
              <div className="text-right">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                  تفاصيل الروشتة #{selected.prescription_id || selected.id}
                </h3>
                {selected.patient_name && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    المريض: {selected.patient_name}
                  </p>
                )}
              </div>
            </div>

            <div className="p-6">
              <PrescriptionCard rx={selected} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
