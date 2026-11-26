"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import type { BookingResponse } from "@/lib/types/api";

type BookingView = BookingResponse & {
  booking_id?: number;
  booking_to?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  staff_id?: number;
  staff_name?: string;
  staff_specialty?: string;
  specialist?: string;
  specialty?: string;
};

const ARABIC_LOCALE = "ar-EG-u-nu-arab";
const EXCLUDED_DETAIL_KEYS = new Set(["booking_id", "id"]);

const DETAIL_LABELS: Record<string, string> = {
  booking_date: "تاريخ الحجز",
  booking_from: "وقت البداية",
  booking_to: "وقت النهاية",
  booking_time: "وقت الحجز",
  status: "الحالة",
  patient_name: "اسم المريض",
  patient_phone: "رقم المريض",
  patient_id: "رقم المريض",
  doctor_name: "اسم الطبيب",
  doctor_id: "رقم الطبيب",
  doctor_specialty: "تخصص الطبيب",
  staff_name: "اسم الطبيب",
  staff_id: "رقم الطبيب",
  staff_specialty: "التخصص",
  specialist: "التخصص",
  specialty: "التخصص",
  clinic_id: "رقم العيادة",
  created_at: "تاريخ الإنشاء",
  updated_at: "تاريخ التحديث",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "تم الكشف",
  cancelled: "ملغي",
  canceled: "ملغي",
  rejected: "مرفوض",
};

function formatDetailLabel(key: string) {
  return DETAIL_LABELS[key] ?? key.replace(/_/g, " ");
}

function formatDetailValue(
  key: string,
  value: unknown,
  booking: BookingView,
  isPast: boolean
) {
  if (value === null || value === undefined || value === "") return "—";

  if (key === "status") {
    if (isPast) return "تم الكشف";
    if (typeof value === "string") {
      return STATUS_LABELS[value.toLowerCase()] ?? value;
    }
  }

  if (["booking_date", "created_at", "updated_at"].includes(key)) {
    if (typeof value === "string") {
      return formatDateWithWeekday(value);
    }
  }

  if (["booking_from", "booking_to", "booking_time"].includes(key)) {
    if (typeof value === "string") {
      return formatTimeLabel(booking.booking_date, value);
    }
  }

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getBookingDetails(booking: BookingView) {
  const isPast = isPastBooking(booking.booking_date);

  return Object.entries(booking)
    .filter(([key]) => !key.toLowerCase().includes("prescription"))
    .filter(([key]) => !EXCLUDED_DETAIL_KEYS.has(key))
    .map(([key, value]) => ({
      key,
      label: formatDetailLabel(key),
      value: formatDetailValue(key, value, booking, isPast),
    }));
}

function formatDateWithWeekday(dateValue?: string) {
  if (!dateValue) return "—";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString(ARABIC_LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function formatTimeLabel(dateValue?: string, timeValue?: string) {
  if (!timeValue && !dateValue) return "—";
  if (!timeValue) {
    const parsed = new Date(dateValue as string);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleTimeString(ARABIC_LOCALE, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const match = timeValue.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeValue;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const base = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(base.getTime())) return timeValue;

  base.setHours(hours, minutes, 0, 0);
  return base.toLocaleTimeString(ARABIC_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isPastBooking(dateValue?: string) {
  if (!dateValue) return false;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return false;
  const bookingDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return bookingDay < todayDay;
}

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null;
}

function unwrapData(data: unknown): unknown {
  if (isRecord(data) && data.data !== undefined) return unwrapData(data.data);
  return data;
}

type ProfileSummary = {
  name?: string;
  specialty?: string;
};

function normalizeProfileSummary(payload: unknown): ProfileSummary | null {
  const unwrapped = unwrapData(payload);
  if (!isRecord(unwrapped)) return null;

  const record =
    (unwrapped.profile || unwrapped.doctor || unwrapped.staff || unwrapped) as ApiRecord;
  const name =
    typeof record.full_name === "string"
      ? record.full_name
      : typeof record.name === "string"
        ? record.name
        : undefined;
  const specialty =
    typeof record.specialist === "string"
      ? record.specialist
      : typeof record.role_title === "string"
        ? record.role_title
        : typeof record.specialty === "string"
          ? record.specialty
          : undefined;

  if (!name && !specialty) return null;
  return { name, specialty };
}

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const bookingsApi = useApi<BookingResponse[]>();
  const [selectedDate, setSelectedDate] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [doctorProfiles, setDoctorProfiles] = useState<Record<number, ProfileSummary>>(
    {}
  );
  const [staffProfiles, setStaffProfiles] = useState<Record<number, ProfileSummary>>(
    {}
  );

  useEffect(() => {
    if (!user) return;
    bookingsApi.execute("/api/bookings/my-bookings");
  }, [user]);

  const bookings = useMemo(
    () => (Array.isArray(bookingsApi.data) ? (bookingsApi.data as BookingView[]) : []),
    [bookingsApi.data]
  );

  const filteredBookings = useMemo(() => {
    if (!appliedDate) return bookings;
    return bookings.filter((booking) =>
      booking.booking_date?.startsWith(appliedDate)
    );
  }, [bookings, appliedDate]);

  useEffect(() => {
    if (bookings.length === 0) return;

    const doctorIds = Array.from(
      new Set(bookings.map((booking) => booking.doctor_id).filter(Boolean))
    ) as number[];
    const staffIds = Array.from(
      new Set(
        bookings
          .map((booking) => booking.staff_id)
          .filter(Boolean)
      )
    ) as number[];

    const missingDoctorIds = doctorIds.filter((id) => !doctorProfiles[id]);
    const missingStaffIds = staffIds.filter((id) => !staffProfiles[id]);

    if (missingDoctorIds.length === 0 && missingStaffIds.length === 0) return;

    let cancelled = false;

    async function loadProfiles() {
      const doctorRequests = missingDoctorIds.map(async (id) => {
        const response = await fetch(`/api/doctors/profile?id=${id}`, {
          credentials: "include",
        });
        const payload = await response.json();
        if (!response.ok || payload.success === false) {
          throw new Error(
            payload.error || payload.message || "Failed to load doctor profile"
          );
        }
        const summary = normalizeProfileSummary(payload);
        return summary ? { id, summary } : null;
      });

      const staffRequests = missingStaffIds.map(async (id) => {
        const response = await fetch(`/api/staff/${id}/profile`, {
          credentials: "include",
        });
        const payload = await response.json();
        if (!response.ok || payload.success === false) {
          throw new Error(
            payload.error || payload.message || "Failed to load staff profile"
          );
        }
        const summary = normalizeProfileSummary(payload);
        return summary ? { id, summary } : null;
      });

      const results = await Promise.allSettled([
        ...doctorRequests,
        ...staffRequests,
      ]);

      if (cancelled) return;

      const nextDoctors: Record<number, ProfileSummary> = {};
      const nextStaff: Record<number, ProfileSummary> = {};

      results.forEach((result, index) => {
        if (result.status !== "fulfilled" || !result.value) return;
        const value = result.value;
        if (index < doctorRequests.length) {
          nextDoctors[value.id] = value.summary;
        } else {
          nextStaff[value.id] = value.summary;
        }
      });

      if (Object.keys(nextDoctors).length > 0) {
        setDoctorProfiles((current) => ({ ...current, ...nextDoctors }));
      }
      if (Object.keys(nextStaff).length > 0) {
        setStaffProfiles((current) => ({ ...current, ...nextStaff }));
      }
    }

    loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [bookings, doctorProfiles, staffProfiles]);

  const handleCancelBooking = async (bookingId?: number) => {
    if (!bookingId) return;
    setCancelError("");
    setCancelingId(bookingId);

    try {
      const response = await fetch(`/api/book/${bookingId}/cancel`, {
        method: "PATCH",
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok || payload.success === false) {
        throw new Error(
          payload.error || payload.message || "Failed to cancel booking"
        );
      }

      await bookingsApi.execute("/api/bookings/my-bookings");
    } catch (error: unknown) {
      setCancelError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إلغاء الحجز"
      );
    } finally {
      setCancelingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
        <div className="rounded-3xl bg-white px-8 py-6 shadow-md border border-slate-200">
          جارٍ التحقق من حسابك...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center px-4 py-10">
        <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">أنت بحاجة لتسجيل الدخول</h1>
          <p className="text-slate-600">
            يرجى تسجيل الدخول أولاً لعرض حجوزاتك القادمة وسجل زياراتك.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-16 pt-28" dir="rtl">
      <section className="mx-auto w-full max-w-6xl px-4">
        <div className="flex flex-col gap-6 rounded-4xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">حجوزاتي</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                المواعيد القادمة وسجل الزيارات
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-slate-600">
                تصفية بالتاريخ
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setAppliedDate(selectedDate)}
                disabled={!selectedDate}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedDate
                    ? "bg-[#001A6E] text-white hover:bg-[#001250]"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                تطبيق
              </button>
              {(selectedDate || appliedDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate("");
                    setAppliedDate("");
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  عرض الكل
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">إجمالي الحجوزات</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {bookings.length}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">حجوزات اليوم</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {bookings.filter((booking) => booking.booking_date?.startsWith(new Date().toISOString().slice(0, 10))).length}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">المعروضة الآن</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {filteredBookings.length}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          {bookingsApi.loading && (
            <p className="text-center text-base font-semibold text-slate-600">
              جارٍ تحميل الحجوزات...
            </p>
          )}

          {cancelError && (
            <p className="text-center text-base font-semibold text-red-600">
              {cancelError}
            </p>
          )}

          {!bookingsApi.loading && bookingsApi.error && (
            <p className="text-center text-base font-semibold text-red-600">
              {bookingsApi.error instanceof Error
                ? bookingsApi.error.message
                : "حدث خطأ أثناء تحميل الحجوزات"}
            </p>
          )}

          {!bookingsApi.loading && !bookingsApi.error && filteredBookings.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
              لا توجد حجوزات مطابقة للتاريخ المحدد.
            </div>
          )}

          <div className="grid gap-4">
            {filteredBookings.map((booking, index) => {
              const bookingId = booking.booking_id ?? booking.id;
              const bookingKey = `${bookingId ?? "booking"}-${booking.booking_date ?? ""}-${booking.booking_from ?? ""}-${index}`;
              const isPast = isPastBooking(booking.booking_date);
              const normalizedStatus = (booking.status || "").toLowerCase();
              const isCancelled = ["cancelled", "canceled", "rejected"].includes(
                normalizedStatus
              );
              const isCompleted = normalizedStatus === "completed";
              const isCancellable = !isPast && !isCancelled && !isCompleted;
              const statusLabel = isPast
                ? "تم الكشف"
                : STATUS_LABELS[normalizedStatus] || "موعد قادم";
              const statusClass = isPast
                ? "text-red-600"
                : isCancelled
                  ? "text-slate-500"
                  : normalizedStatus === "pending"
                    ? "text-amber-600"
                    : "text-emerald-600";
              const isExpanded = expandedKey === bookingKey;
              const details = getBookingDetails(booking);
              const doctorProfile = booking.doctor_id
                ? doctorProfiles[booking.doctor_id]
                : undefined;
              const staffProfile = booking.staff_id
                ? staffProfiles[booking.staff_id]
                : undefined;
              const doctorName =
                booking.doctor_name ||
                booking.staff_name ||
                staffProfile?.name ||
                doctorProfile?.name ||
                (booking.doctor_id
                  ? `Doctor #${booking.doctor_id}`
                  : booking.staff_id
                    ? `Staff #${booking.staff_id}`
                    : "—");
              const doctorSpecialty =
                booking.doctor_specialty ||
                booking.staff_specialty ||
                booking.specialist ||
                booking.specialty ||
                staffProfile?.specialty ||
                doctorProfile?.specialty ||
                "";
              const doctorLine = [doctorName, doctorSpecialty]
                .filter(Boolean)
                .join(" - ");

              return (
                <article
                  key={bookingKey}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${statusClass}`}>
                        {statusLabel}
                      </p>
                      <h2 className="mt-2 text-base font-semibold text-slate-900">
                        {doctorLine || "—"}
                      </h2>
                    </div>

                    <div className="flex flex-col items-start gap-1 text-sm text-slate-600 sm:items-end">
                      <span className="font-medium text-slate-800">
                        {formatDateWithWeekday(booking.booking_date)}
                      </span>
                      <span className="font-medium text-[#001A6E]">
                        {formatTimeLabel(booking.booking_date, booking.booking_from)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      {isCancellable && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(bookingId)}
                          disabled={cancelingId === bookingId}
                          className="self-start rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
                        >
                          {cancelingId === bookingId
                            ? "جارٍ الإلغاء..."
                            : "إلغاء الحجز"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedKey(isExpanded ? null : bookingKey)
                        }
                        className="self-start rounded-xl bg-[#001A6E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#001250] sm:self-auto"
                      >
                        {isExpanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200 pt-4">
                      <dl className="grid gap-3 sm:grid-cols-2">
                        {details.map((detail) => (
                          <div key={`${bookingKey}-${detail.key}`}>
                            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                              {detail.label}
                            </dt>
                            <dd className="mt-1 text-sm font-medium text-slate-700">
                              {detail.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
