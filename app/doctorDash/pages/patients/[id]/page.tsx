"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  X,
  Pill,
  Stethoscope,
  FlaskConical,
  StickyNote,
  FileText,
  Clock,
  CheckCircle,
  Loader2,
  Plus,
  User,
  Phone,
  Calendar,
} from "lucide-react";
import type { Prescription } from "@/lib/types/api";

interface BookingDetail {
  booking_id: number;
  booking_date: string;
  booking_from: string;
  booking_to: string;
  status: string;
  prescription_access_status: "pending" | "accepted" | "rejected" | null;
  patient_name: string;
  patient_phone?: string | null;
  patient_photo?: string | null;
  doctor_name?: string | null;
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
    <div className="rounded-xl border border-(--card-border) p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-(--text-secondary)">
          {formatDate(rx.created_at)}
        </span>
        <span className="font-bold text-(--text-primary)">
          #{rx.prescription_id || rx.id}
        </span>
      </div>

      {rx.symptoms && (
        <div className="text-right">
          <p className="text-xs text-(--text-secondary) mb-1">الأعراض</p>
          <p className="text-sm text-(--text-primary)">{rx.symptoms}</p>
        </div>
      )}
      {rx.diagnosis && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2.5 text-right">
          <p className="text-xs font-semibold text-blue-600 mb-1 flex items-center justify-end gap-1">
            <Stethoscope size={11} /> التشخيص
          </p>
          <p className="text-sm text-blue-900 dark:text-blue-200">{rx.diagnosis}</p>
        </div>
      )}
      {rx.medication_name && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-2.5 text-right">
          <p className="text-xs font-semibold text-green-700 mb-1 flex items-center justify-end gap-1">
            <Pill size={11} /> الدواء
          </p>
          <p className="text-sm text-green-900 dark:text-green-200">
            {rx.medication_name}
            {rx.dose && <span className="text-green-600"> — {rx.dose}</span>}
            {rx.duration && <span className="text-green-600"> لمدة {rx.duration}</span>}
          </p>
        </div>
      )}
      {rx.test_name && (
        <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-2.5 text-right">
          <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center justify-end gap-1">
            <FlaskConical size={11} /> الفحوصات
          </p>
          <p className="text-sm text-purple-900 dark:text-purple-200">
            {rx.test_name}
            {rx.test_result && <span className="text-purple-600"> — {rx.test_result}</span>}
          </p>
        </div>
      )}
      {rx.notes && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-2.5 text-right">
          <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center justify-end gap-1">
            <StickyNote size={11} /> ملاحظات
          </p>
          <p className="text-sm text-amber-900 dark:text-amber-200">{rx.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function PatientDetails() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [accessStatus, setAccessStatus] = useState<
    "pending" | "accepted" | "rejected" | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Prescription modal
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PrescriptionForm>({
    symptoms: "",
    diagnosis: "",
    medication_name: "",
    dose: "",
    duration: "",
    test_name: "",
    test_result: "",
    notes: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const loadData = useCallback(async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch my bookings to find this specific one
      const bookingsRes = await fetch("/api/bookings/my-bookings", {
        credentials: "include",
      });
      const bookingsData = await bookingsRes.json();

      if (bookingsRes.ok && bookingsData?.data) {
        const found = bookingsData.data.find(
          (b: Record<string, unknown>) =>
            String(b.booking_id) === String(bookingId),
        ) as BookingDetail | undefined;

        if (found) {
          setBooking(found);
          setAccessStatus(found.prescription_access_status ?? null);
        } else {
          setError("لم يتم العثور على الحجز");
        }
      }

      // Fetch prescriptions for this booking
      const rxRes = await fetch(`/api/prescriptions/bookings/${bookingId}`, {
        credentials: "include",
      });

      if (rxRes.ok) {
        const rxData = await rxRes.json();
        // The route returns a single prescription or list
        const rx = rxData?.data?.prescription || rxData?.data;
        if (rx) {
          setPrescriptions(Array.isArray(rx) ? rx : [rx]);
        }
      }
    } catch {
      setError("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestAccess = async () => {
    setActionLoading(true);
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
      setAccessStatus("pending");
    } catch {
      alert("حدث خطأ في الاتصال");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePrescription = async () => {
    const { symptoms, diagnosis, medication_name, notes, test_name } = form;
    if (!symptoms && !diagnosis && !medication_name && !notes && !test_name) {
      setFormError("يرجى إدخال الأعراض أو التشخيص أو الدواء أو الفحوصات على الأقل");
      return;
    }
    if ((form.dose || form.duration) && !medication_name) {
      setFormError("اسم الدواء مطلوب عند إدخال الجرعة أو مدة العلاج");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        symptoms: form.symptoms || null,
        diagnosis: form.diagnosis || null,
        medication_name: form.medication_name || null,
        dose: form.dose || null,
        duration: form.duration || null,
        test_name: form.test_name || null,
        test_result: form.test_result || null,
        notes: form.notes || null,
      };

      const response = await fetch(`/api/prescriptions/bookings/${bookingId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setFormError(result.error || "فشل إنشاء الروشتة");
        return;
      }

      setFormSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess(false);
        loadData(); // refresh prescriptions
      }, 1500);
    } catch {
      setFormError("حدث خطأ في الاتصال");
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center text-(--text-secondary)">
          <Loader2 size={40} className="animate-spin mx-auto mb-3 opacity-40" />
          <p>جارٍ تحميل بيانات الحجز...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error || "حجز غير موجود"}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl bg-[#1F2B6C] text-white hover:bg-[#162056] transition"
        >
          رجوع
        </button>
      </div>
    );
  }

  const isConfirmed = booking.status === "confirmed";

  return (
    <div className="space-y-6 p-2">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--text-primary) transition"
      >
        <span>رجوع</span>
        <ArrowRight size={16} />
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Booking info + Prescriptions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Booking Info */}
          <div className="bg-(--card-bg) rounded-2xl border border-(--card-border) p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="text-right">
                <p className="text-sm text-(--text-secondary)">تفاصيل الحجز</p>
                <h2 className="text-xl font-bold text-(--text-primary) mt-1">
                  حجز #{booking.booking_id}
                </h2>
              </div>
              <span
                className={`px-3 py-1 text-sm rounded-full font-semibold ${
                  booking.status === "confirmed"
                    ? "bg-green-100 text-green-700"
                    : booking.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {booking.status === "confirmed"
                  ? "مؤكد"
                  : booking.status === "pending"
                    ? "قيد الانتظار"
                    : booking.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-(--semi-card-bg) p-4 text-right">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <p className="text-xs text-(--text-secondary)">تاريخ الحجز</p>
                  <Calendar size={14} className="text-(--text-secondary)" />
                </div>
                <p className="font-semibold text-(--text-primary)">
                  {formatDate(booking.booking_date)}
                </p>
              </div>
              <div className="rounded-xl bg-(--semi-card-bg) p-4 text-right">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <p className="text-xs text-(--text-secondary)">وقت الحجز</p>
                  <Clock size={14} className="text-(--text-secondary)" />
                </div>
                <p className="font-semibold text-(--text-primary)">
                  {booking.booking_from} — {booking.booking_to}
                </p>
              </div>
            </div>
          </div>

          {/* Prescriptions */}
          <div className="bg-(--card-bg) rounded-2xl border border-(--card-border) p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                {/* Action button */}
                {isConfirmed && accessStatus === "accepted" && prescriptions.length === 0 && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl bg-[#1F2B6C] text-white hover:bg-[#162056] transition"
                  >
                    <Plus size={14} />
                    كتابة روشتة
                  </button>
                )}
                {isConfirmed && (!accessStatus || accessStatus === "rejected") && (
                  <button
                    onClick={handleRequestAccess}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Clock size={14} />
                    )}
                    طلب صلاحية الروشتة
                  </button>
                )}
                {accessStatus === "pending" && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Clock size={14} />
                    في انتظار موافقة المريض
                  </span>
                )}
              </div>

              <div className="text-right">
                <h3 className="font-bold text-lg text-(--text-primary)">
                  الروشتات الطبية
                </h3>
              </div>
            </div>

            {prescriptions.length === 0 ? (
              <div className="text-center py-10 text-(--text-secondary)">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">لا توجد روشتة لهذا الحجز</p>
                {isConfirmed && accessStatus === "accepted" && (
                  <p className="text-sm mt-1 opacity-70">
                    يمكنك كتابة الروشتة الآن
                  </p>
                )}
                {isConfirmed && (!accessStatus || accessStatus === "rejected") && (
                  <p className="text-sm mt-1 opacity-70">
                    اطلب صلاحية الروشتة أولاً
                  </p>
                )}
                {accessStatus === "pending" && (
                  <p className="text-sm mt-1 opacity-70">
                    في انتظار موافقة المريض على صلاحية الروشتة
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((rx) => (
                  <PrescriptionCard key={rx.prescription_id || rx.id} rx={rx} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Patient info */}
        <div className="bg-(--card-bg) rounded-2xl border border-(--card-border) p-6 space-y-5 h-fit">
          <div className="text-center">
            {booking.patient_photo ? (
              <img
                src={booking.patient_photo}
                alt={booking.patient_name}
                className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#1F2B6C] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                {booking.patient_name?.charAt(0) || "م"}
              </div>
            )}
            <h3 className="font-bold text-xl text-(--text-primary)">
              {booking.patient_name}
            </h3>
          </div>

          <div className="space-y-3">
            {booking.patient_phone && (
              <div className="flex items-center justify-between rounded-xl bg-(--semi-card-bg) p-3">
                <Phone size={16} className="text-(--text-secondary)" />
                <div className="text-right">
                  <p className="text-xs text-(--text-secondary)">رقم الهاتف</p>
                  <p className="text-sm font-medium text-(--text-primary)">
                    {booking.patient_phone}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-(--semi-card-bg) p-3">
              <FileText size={16} className="text-(--text-secondary)" />
              <div className="text-right">
                <p className="text-xs text-(--text-secondary)">صلاحية الروشتة</p>
                <p
                  className={`text-sm font-semibold ${
                    accessStatus === "accepted"
                      ? "text-green-600"
                      : accessStatus === "pending"
                        ? "text-amber-600"
                        : accessStatus === "rejected"
                          ? "text-red-600"
                          : "text-(--text-secondary)"
                  }`}
                >
                  {accessStatus === "accepted"
                    ? "مسموح"
                    : accessStatus === "pending"
                      ? "قيد الانتظار"
                      : accessStatus === "rejected"
                        ? "مرفوض"
                        : "لم يُطلب بعد"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Prescription Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a2744] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
              <div className="text-right">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                  كتابة روشتة طبية
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {booking.patient_name}
                </p>
              </div>
            </div>

            {formSuccess ? (
              <div className="flex flex-col items-center gap-4 py-12 px-6">
                <CheckCircle size={56} className="text-green-500" />
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  تم إنشاء الروشتة بنجاح
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {(["symptoms", "diagnosis"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-right">
                      {field === "symptoms" ? "الأعراض" : "التشخيص"}
                    </label>
                    <textarea
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      rows={2}
                      dir="rtl"
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] resize-none text-right"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(["medication_name", "dose", "duration"] as const).map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-right">
                        {field === "medication_name"
                          ? "اسم الدواء"
                          : field === "dose"
                            ? "الجرعة"
                            : "مدة العلاج"}
                      </label>
                      <input
                        type="text"
                        value={form[field]}
                        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                        dir="rtl"
                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] text-right"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(["test_name", "test_result"] as const).map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-right">
                        {field === "test_name" ? "اسم الفحص" : "نتيجة الفحص"}
                      </label>
                      <input
                        type="text"
                        value={form[field]}
                        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                        dir="rtl"
                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] text-right"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-right">
                    ملاحظات
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    dir="rtl"
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] resize-none text-right"
                  />
                </div>

                {formError && (
                  <p className="text-sm text-red-600 text-right">{formError}</p>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleCreatePrescription}
                    disabled={formSubmitting}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#1F2B6C] text-white hover:bg-[#162056] transition disabled:opacity-60 flex items-center gap-2"
                  >
                    {formSubmitting ? (
                      <><Loader2 size={16} className="animate-spin" />جارٍ الإرسال...</>
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
    </div>
  );
}