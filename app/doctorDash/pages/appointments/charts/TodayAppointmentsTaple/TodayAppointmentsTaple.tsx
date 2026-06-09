"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  X,
} from "lucide-react";

const statusColors: Record<string, string> = {
  مكتملة: "bg-green-100 text-green-600",
  قادمة: "bg-purple-100 text-purple-600",
  "...جارية الأن": "bg-blue-100 text-blue-600",
};

const accessStatusLabels: Record<string, { label: string; color: string }> = {
  accepted: { label: "مسموح", color: "text-green-600 bg-green-50" },
  pending: { label: "في انتظار الموافقة", color: "text-amber-600 bg-amber-50" },
  rejected: { label: "مرفوض", color: "text-red-600 bg-red-50" },
};

interface Booking {
  id: number;
  name: string;
  email: string;
  age: string;
  status: string;
  time: string;
  type: string;
  date: string;
  rawStatus: string;
  prescriptionAccess: "pending" | "accepted" | "rejected" | null;
}

interface PrescriptionForm {
  symptoms: string;
  diagnosis: string;
  medication_name: string;
  dose: string;
  duration: string;
  test_name: string;
  test_result: string;
  notes: string;
}

export default function TodayAppointmentsTaple() {
  const router = useRouter();

  const [data, setData] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Prescription modal state
  const [prescriptionModal, setPrescriptionModal] = useState<{
    open: boolean;
    bookingId: number | null;
    patientName: string;
  }>({ open: false, bookingId: null, patientName: "" });

  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionForm>({
    symptoms: "",
    diagnosis: "",
    medication_name: "",
    dose: "",
    duration: "",
    test_name: "",
    test_result: "",
    notes: "",
  });

  const [prescriptionSubmitting, setPrescriptionSubmitting] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState<string | null>(null);
  const [prescriptionSuccess, setPrescriptionSuccess] = useState(false);

  const pageSize = 5;

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/bookings/my-bookings", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok || !result?.data || !Array.isArray(result.data)) {
        setData([]);
        return;
      }

      const formattedData = result.data.map((item: Record<string, unknown>) => {
        let bDate = "";
        if (item.booking_date) {
          const d = new Date(item.booking_date as string);
          bDate = isNaN(d.getTime()) ? String(item.booking_date) : d.toISOString().slice(0, 10);
        }
        return {
          id: item.booking_id as number,
          name: (item.patient_name as string) || "Unknown",
          email: (item.patient_phone as string) || "لا يوجد هاتف",
          age: "--",
          status:
            item.status === "confirmed"
              ? "مكتملة"
              : item.status === "pending"
                ? "قادمة"
                : "...جارية الأن",
          time: `${item.booking_from} - ${item.booking_to}`,
          type: "كشف",
          date: bDate,
          rawStatus: item.status as string,
          prescriptionAccess: (item.prescription_access_status as "pending" | "accepted" | "rejected" | null) ?? null,
        };
      });

      setData(formattedData);
    } catch (error) {
      console.error("FETCH ERROR =>", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleRequestAccess = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      const response = await fetch(
        `/api/prescriptions/bookings/${bookingId}/request-access`,
        { method: "POST", credentials: "include" },
      );
      const result = await response.json();
      if (!response.ok) {
        alert(result.error || "حدث خطأ أثناء طلب الصلاحية");
        return;
      }
      // update local state
      setData((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, prescriptionAccess: "pending" } : b,
        ),
      );
    } catch {
      alert("حدث خطأ في الاتصال");
    } finally {
      setActionLoading(null);
    }
  };

  const openPrescriptionModal = (bookingId: number, patientName: string) => {
    setPrescriptionModal({ open: true, bookingId, patientName });
    setPrescriptionForm({
      symptoms: "",
      diagnosis: "",
      medication_name: "",
      dose: "",
      duration: "",
      test_name: "",
      test_result: "",
      notes: "",
    });
    setPrescriptionError(null);
    setPrescriptionSuccess(false);
  };

  const handleCreatePrescription = async () => {
    if (!prescriptionModal.bookingId) return;

    const { symptoms, diagnosis, medication_name, notes, test_name } =
      prescriptionForm;

    if (!symptoms && !diagnosis && !medication_name && !notes && !test_name) {
      setPrescriptionError(
        "يرجى إدخال الأعراض أو التشخيص أو الدواء أو الفحوصات أو الملاحظات على الأقل",
      );
      return;
    }

    if ((prescriptionForm.dose || prescriptionForm.duration) && !medication_name) {
      setPrescriptionError("اسم الدواء مطلوب عند إدخال الجرعة أو مدة العلاج");
      return;
    }

    setPrescriptionSubmitting(true);
    setPrescriptionError(null);

    try {
      const payload = {
        symptoms: prescriptionForm.symptoms || null,
        diagnosis: prescriptionForm.diagnosis || null,
        medication_name: prescriptionForm.medication_name || null,
        dose: prescriptionForm.dose || null,
        duration: prescriptionForm.duration || null,
        test_name: prescriptionForm.test_name || null,
        test_result: prescriptionForm.test_result || null,
        notes: prescriptionForm.notes || null,
      };

      const response = await fetch(
        `/api/prescriptions/bookings/${prescriptionModal.bookingId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setPrescriptionError(result.error || "فشل إنشاء الروشتة");
        return;
      }

      setPrescriptionSuccess(true);
      setTimeout(() => {
        setPrescriptionModal({ open: false, bookingId: null, patientName: "" });
        setPrescriptionSuccess(false);
      }, 1800);
    } catch {
      setPrescriptionError("حدث خطأ في الاتصال");
    } finally {
      setPrescriptionSubmitting(false);
    }
  };

  const totalPages = Math.ceil(data.length / pageSize);
  const paginated = data.slice((page - 1) * pageSize, page * pageSize);

  const getPages = () => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 2) return [1, 2, 3, ...(totalPages > 3 ? ["..."] : [])];
    if (page >= totalPages - 1)
      return [
        ...(totalPages > 3 ? ["..."] : []),
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return ["...", page - 1, page, page + 1, "..."];
  };

  return (
    <>
      <div className="bg-(--card-bg) rounded-2xl flex flex-col gap-6 border border-(--card-border) p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative flex justify-center items-end flex-col gap-3">
            <h3 className="font-bold text-2xl text-(--text-primary)">
              قائمة الحجوزات
            </h3>
            <span className="text-md text-(--text-secondary)">
              إدارة الحجوزات والروشتات الطبية
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-(--text-secondary)">
            جاري التحميل...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-(--text-secondary)">
            لا يوجد حجوزات
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-(--text-primary) text-base">
                  <tr className="text-center border-b border-(--card-border)">
                    <th className="pb-3 text-right">المريض</th>
                    <th className="pb-3">الوقت</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3">صلاحية الروشتة</th>
                    <th className="pb-3">إجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {paginated.map((p) => {
                    const accessInfo = p.prescriptionAccess
                      ? accessStatusLabels[p.prescriptionAccess]
                      : null;

                    return (
                      <tr
                        key={p.id}
                        className="text-(--text-primary) hover:bg-(--semi-card-bg) transition text-center w-full border-b border-(--card-border)/40"
                      >
                        {/* Patient */}
                        <td className="py-3">
                          <div className="flex items-center gap-3 justify-start">
                            <div className="text-right">
                              <p className="font-semibold">{p.name}</p>
                              <p className="text-xs text-(--text-secondary)">
                                {p.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Time */}
                        <td className="py-3">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-medium">{p.time}</span>
                            <span className="text-xs text-(--text-secondary)">
                              {p.type} {p.date && `| ${p.date}`}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-md ${statusColors[p.status] || "bg-gray-100 text-gray-600"}`}
                          >
                            {p.status}
                          </span>
                        </td>

                        {/* Prescription Access */}
                        <td className="py-3">
                          {accessInfo ? (
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium ${accessInfo.color}`}
                            >
                              {accessInfo.label}
                            </span>
                          ) : (
                            <span className="text-xs text-(--text-secondary)">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3">
                          <div className="flex items-center justify-center gap-2">
                            {/* Request access: only if confirmed & no access yet or rejected */}
                            {p.rawStatus === "confirmed" &&
                              (!p.prescriptionAccess || p.prescriptionAccess === "rejected") && (
                                <button
                                  onClick={() => handleRequestAccess(p.id)}
                                  disabled={actionLoading === p.id}
                                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition border border-amber-200 disabled:opacity-60"
                                  title="طلب صلاحية الروشتة"
                                >
                                  {actionLoading === p.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Clock size={12} />
                                  )}
                                  <span>طلب صلاحية</span>
                                </button>
                              )}

                            {/* Write prescription: only if access accepted */}
                            {p.rawStatus === "confirmed" &&
                              p.prescriptionAccess === "accepted" && (
                                <button
                                  onClick={() =>
                                    openPrescriptionModal(p.id, p.name)
                                  }
                                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition border border-green-200"
                                  title="كتابة روشتة"
                                >
                                  <Plus size={12} />
                                  <span>روشتة</span>
                                </button>
                              )}

                            {/* View patient details */}
                            <button
                              onClick={() =>
                                router.push(
                                  `/doctorDash/pages/patients/${p.id}`,
                                )
                              }
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-(--semi-card-bg) text-(--text-secondary) hover:text-(--text-primary) transition border border-(--card-border)"
                              title="تفاصيل المريض"
                            >
                              <FileText size={12} />
                              <span>تفاصيل</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="cursor-pointer text-2xl flex items-center justify-center border border-(--input-border) rounded-md p-1 hover:bg-(--semi-card-bg) transition"
                >
                  <ChevronLeft size={19} />
                </button>

                {getPages().map((p, i) => (
                  <button
                    key={i}
                    onClick={() => typeof p === "number" && setPage(p)}
                    disabled={p === "..."}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      p === page
                        ? "bg-[#1F2B6C] text-white"
                        : p === "..."
                          ? "cursor-default text-gray-400"
                          : "border border-(--input-border) hover:bg-(--semi-card-bg)"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setPage((p) => Math.min(p + 1, totalPages))
                  }
                  className="cursor-pointer text-2xl flex items-center justify-center border border-(--input-border) rounded-md p-1 hover:bg-(--semi-card-bg) transition"
                >
                  <ChevronRight size={19} />
                </button>
              </div>

              <p className="text-(--text-secondary)">
                عرض {page} - {totalPages} من أصل {data.length} حجز
              </p>
            </div>
          </>
        )}
      </div>

      {/* Create Prescription Modal */}
      {prescriptionModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a2744] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
              <button
                onClick={() =>
                  setPrescriptionModal({ open: false, bookingId: null, patientName: "" })
                }
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
              <div className="text-right">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                  كتابة روشتة طبية
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  المريض: {prescriptionModal.patientName}
                </p>
              </div>
            </div>

            {prescriptionSuccess ? (
              <div className="flex flex-col items-center gap-4 py-12 px-6">
                <CheckCircle size={56} className="text-green-500" />
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  تم إنشاء الروشتة بنجاح
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Symptoms */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-right">
                    الأعراض
                  </label>
                  <textarea
                    value={prescriptionForm.symptoms}
                    onChange={(e) =>
                      setPrescriptionForm((f) => ({ ...f, symptoms: e.target.value }))
                    }
                    rows={2}
                    placeholder="صف أعراض المريض..."
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 resize-none text-right"
                    dir="rtl"
                  />
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-right">
                    التشخيص
                  </label>
                  <textarea
                    value={prescriptionForm.diagnosis}
                    onChange={(e) =>
                      setPrescriptionForm((f) => ({ ...f, diagnosis: e.target.value }))
                    }
                    rows={2}
                    placeholder="التشخيص الطبي..."
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 resize-none text-right"
                    dir="rtl"
                  />
                </div>

                {/* Medication */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-right">
                      اسم الدواء
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.medication_name}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, medication_name: e.target.value }))
                      }
                      placeholder="مثال: باراسيتامول"
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 text-right"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-right">
                      الجرعة
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.dose}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, dose: e.target.value }))
                      }
                      placeholder="مثال: 500 ملغ"
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 text-right"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-right">
                      مدة العلاج
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.duration}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, duration: e.target.value }))
                      }
                      placeholder="مثال: 5 أيام"
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 text-right"
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Tests */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-right">
                      اسم الفحص
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.test_name}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, test_name: e.target.value }))
                      }
                      placeholder="مثال: صورة دم كاملة"
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 text-right"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-right">
                      نتيجة الفحص
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.test_result}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, test_result: e.target.value }))
                      }
                      placeholder="نتيجة الفحص..."
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 text-right"
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-right">
                    ملاحظات إضافية
                  </label>
                  <textarea
                    value={prescriptionForm.notes}
                    onChange={(e) =>
                      setPrescriptionForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    rows={3}
                    placeholder="أي ملاحظات أو تعليمات إضافية..."
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 resize-none text-right"
                    dir="rtl"
                  />
                </div>

                {prescriptionError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-red-700 text-sm">
                    <XCircle size={16} />
                    <span>{prescriptionError}</span>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() =>
                      setPrescriptionModal({ open: false, bookingId: null, patientName: "" })
                    }
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleCreatePrescription}
                    disabled={prescriptionSubmitting}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#1F2B6C] text-white hover:bg-[#162056] transition disabled:opacity-60 flex items-center gap-2"
                  >
                    {prescriptionSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        جارٍ الإرسال...
                      </>
                    ) : (
                      "حفظ الروشتة"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}