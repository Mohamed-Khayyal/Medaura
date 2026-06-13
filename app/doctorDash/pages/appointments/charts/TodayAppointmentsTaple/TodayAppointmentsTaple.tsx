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
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-600",
  confirmed: "bg-blue-100 text-blue-600",
  approved: "bg-blue-100 text-blue-600",
  pending: "bg-amber-100 text-amber-600",
  cancelled: "bg-red-100 text-red-600",
  rejected: "bg-red-100 text-red-600",
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
  const locale = useLocale();
  const isRtl = locale === "ar";

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

  const accessStatusLabels: Record<string, { label: string; color: string }> = {
    accepted: { label: t("doctorDashPages.todayAppointments.accessAllowed", locale) || "مسموح", color: "text-green-600 bg-green-50" },
    pending: { label: t("doctorDashPages.todayAppointments.accessPending", locale) || "في انتظار الموافقة", color: "text-amber-600 bg-amber-50" },
    rejected: { label: t("doctorDashPages.todayAppointments.accessRejected", locale) || "مرفوض", color: "text-red-600 bg-red-50" },
  };

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
          email: (item.patient_phone as string) || t("doctorDashPages.todayAppointments.patientPhone", locale),
          age: "--",
          status: item.status as string,
          time: `${item.booking_from} - ${item.booking_to}`,
          type: t("appointmentsPage.visit", locale) || (isRtl ? "زيارة" : "Visit"),
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
  }, [locale, isRtl]);

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
        alert(result.error || t("doctorDashPages.todayAppointments.requestAccessError", locale));
        return;
      }
      // update local state
      setData((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, prescriptionAccess: "pending" } : b,
        ),
      );
    } catch {
      alert(t("doctorDashPages.todayAppointments.connectionError", locale));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (bookingId: number, nextStatus: string) => {
    setActionLoading(bookingId);
    try {
      const response = await fetch(`/api/book/${bookingId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        alert(result.error || (isRtl ? "فشل تحديث حالة الحجز" : "Failed to update booking status"));
        return;
      }
      setData((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: nextStatus, rawStatus: nextStatus } : b
        )
      );
    } catch {
      alert(t("doctorDashPages.todayAppointments.connectionError", locale));
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
        t("doctorDashPages.todayAppointments.validationAtLeastOne", locale)
      );
      return;
    }

    if ((prescriptionForm.dose || prescriptionForm.duration) && !medication_name) {
      setPrescriptionError(t("doctorDashPages.todayAppointments.validationMedRequired", locale));
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
        setPrescriptionError(result.error || t("doctorDashPages.todayAppointments.prescriptionError", locale));
        return;
      }

      // Update local state status to completed
      setData((prev) =>
        prev.map((b) =>
          b.id === prescriptionModal.bookingId
            ? { ...b, status: "completed", rawStatus: "completed" }
            : b
        )
      );

      setPrescriptionSuccess(true);
      setTimeout(() => {
        setPrescriptionModal({ open: false, bookingId: null, patientName: "" });
        setPrescriptionSuccess(false);
      }, 1800);
    } catch {
      setPrescriptionError(t("doctorDashPages.todayAppointments.connectionError", locale));
    } finally {
      setPrescriptionSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
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

  const getStatusLabel = (status: string) => {
    if (status === "completed") return t("appointmentsPage.statusCompleted", locale) || (isRtl ? "مكتملة" : "Completed");
    if (status === "confirmed" || status === "approved") return t("appointmentsPage.statusConfirmed", locale) || (isRtl ? "مؤكدة" : "Confirmed");
    if (status === "pending") return t("appointmentsPage.statusPending", locale) || (isRtl ? "قادمة" : "Pending");
    if (status === "cancelled" || status === "rejected") return t("appointmentsPage.statusCancelled", locale) || (isRtl ? "ملغاة" : "Cancelled");
    return status;
  };

  return (
    <>
      <div className="flex min-w-0 flex-col gap-5 rounded-2xl border border-(--card-border) bg-(--card-bg) p-3 sm:gap-6 sm:p-6" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between mb-4">
          <div className="relative flex flex-col gap-1 text-start">
            <h3 className="text-xl font-bold text-(--text-primary) sm:text-2xl">
              {t("doctorDashPages.todayAppointments.title", locale)}
            </h3>
            <span className="text-md text-(--text-secondary)">
              {t("doctorDashPages.todayAppointments.subtitle", locale)}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-(--text-secondary)">
            {t("doctorDashPages.todayAppointments.loading", locale)}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-(--text-secondary)">
            {t("doctorDashPages.todayAppointments.noBookings", locale)}
          </div>
        ) : (
          <>
            {/* Mobile booking cards */}
            <div className="grid gap-3 md:hidden">
              {paginated.map((booking) => {
                const accessInfo = booking.prescriptionAccess
                  ? accessStatusLabels[booking.prescriptionAccess]
                  : null;

                return (
                  <article
                    key={booking.id}
                    className="rounded-xl border border-(--card-border) bg-(--semi-card-bg) p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 text-start">
                        <p className="truncate font-semibold text-(--text-primary)">
                          {booking.name}
                        </p>
                        <p className="truncate text-xs text-(--text-secondary)">
                          {booking.email}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium ${
                          statusColors[booking.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-y border-(--card-border) py-3">
                      <div className="text-start">
                        <p className="text-[10px] text-(--text-secondary)">
                          {t("doctorDashPages.todayAppointments.colTime", locale)}
                        </p>
                        <p className="text-xs font-semibold text-(--text-primary)">
                          {booking.time}
                        </p>
                        <p className="text-[10px] text-(--text-secondary)">
                          {booking.type} {booking.date && `| ${booking.date}`}
                        </p>
                      </div>
                      <div className="text-start">
                        <p className="text-[10px] text-(--text-secondary)">
                          {t(
                            "doctorDashPages.todayAppointments.colPrescriptionAccess",
                            locale,
                          )}
                        </p>
                        {accessInfo ? (
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${accessInfo.color}`}
                          >
                            {accessInfo.label}
                          </span>
                        ) : (
                          <span className="text-xs text-(--text-secondary)">—</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {booking.rawStatus === "pending" && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                            disabled={actionLoading === booking.id}
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 transition hover:bg-green-100 disabled:opacity-60 font-semibold cursor-pointer"
                          >
                            {actionLoading === booking.id && <Loader2 size={12} className="animate-spin" />}
                            {isRtl ? "تأكيد الدفع" : "Confirm Payment"}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "rejected")}
                            disabled={actionLoading === booking.id}
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 transition hover:bg-red-100 disabled:opacity-60 font-semibold cursor-pointer"
                          >
                            {isRtl ? "رفض" : "Reject"}
                          </button>
                        </div>
                      )}

                      {booking.rawStatus === "confirmed" && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "completed")}
                            disabled={actionLoading === booking.id}
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-700 transition hover:bg-teal-100 disabled:opacity-60 font-semibold cursor-pointer"
                          >
                            {actionLoading === booking.id && <Loader2 size={12} className="animate-spin" />}
                            {isRtl ? "إكمال الكشف" : "Complete Visit"}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                            disabled={actionLoading === booking.id}
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 transition hover:bg-red-100 disabled:opacity-60 font-semibold cursor-pointer"
                          >
                            {isRtl ? "إلغاء" : "Cancel"}
                          </button>
                        </div>
                      )}

                      {booking.rawStatus === "confirmed" &&
                        (!booking.prescriptionAccess ||
                          booking.prescriptionAccess === "rejected") && (
                          <button
                            onClick={() => handleRequestAccess(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                          >
                            {actionLoading === booking.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Clock size={14} />
                            )}
                            {t(
                              "doctorDashPages.todayAppointments.requestAccess",
                              locale,
                            )}
                          </button>
                        )}

                      {booking.rawStatus === "confirmed" &&
                        booking.prescriptionAccess === "accepted" && (
                          <button
                            onClick={() =>
                              openPrescriptionModal(
                                booking.id,
                                booking.name,
                              )
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 transition hover:bg-green-100"
                          >
                            <Plus size={14} />
                            {t(
                              "doctorDashPages.todayAppointments.prescription",
                              locale,
                            )}
                          </button>
                        )}

                      <button
                        onClick={() =>
                          router.push(
                            `/doctorDash/pages/patients/${booking.id}`,
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-(--card-border) bg-(--card-bg) px-3 py-2 text-xs text-(--text-primary)"
                      >
                        <FileText size={14} />
                        {t(
                          "doctorDashPages.todayAppointments.details",
                          locale,
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden w-full overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead className="text-(--text-primary) text-base border-b border-(--card-border)">
                  <tr className="text-center">
                    <th className={`pb-3 ${isRtl ? "text-right pr-4" : "text-left pl-4"}`}>{t("doctorDashPages.todayAppointments.colPatient", locale)}</th>
                    <th className="pb-3">{t("doctorDashPages.todayAppointments.colTime", locale)}</th>
                    <th className="pb-3">{t("doctorDashPages.todayAppointments.colStatus", locale)}</th>
                    <th className="pb-3">{t("doctorDashPages.todayAppointments.colPrescriptionAccess", locale)}</th>
                    <th className="pb-3">{t("doctorDashPages.todayAppointments.colActions", locale)}</th>
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
                        <td className="py-4">
                          <div className={`flex items-center gap-3 px-4 ${isRtl ? "justify-end" : "justify-start"}`}>
                            <div className={isRtl ? "text-right" : "text-left"}>
                              <p className="font-semibold">{p.name}</p>
                              <p className="text-xs text-(--text-secondary)">
                                {p.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Time */}
                        <td className="py-4">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-medium">{p.time}</span>
                            <span className="text-xs text-(--text-secondary)">
                              {p.type} {p.date && `| ${p.date}`}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4">
                          <span
                            className={`px-2.5 py-1 text-xs rounded-md font-medium ${statusColors[p.status] || "bg-gray-100 text-gray-600"}`}
                          >
                            {getStatusLabel(p.status)}
                          </span>
                        </td>

                        {/* Prescription Access */}
                        <td className="py-4">
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
                        <td className="py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Status transitions */}
                            {p.rawStatus === "pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(p.id, "confirmed")}
                                  disabled={actionLoading === p.id}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition border border-green-200 disabled:opacity-60 cursor-pointer font-medium"
                                  title={isRtl ? "تأكيد الدفع" : "Confirm Payment"}
                                >
                                  {actionLoading === p.id && <Loader2 size={12} className="animate-spin" />}
                                  <span>{isRtl ? "تأكيد الدفع" : "Confirm Payment"}</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(p.id, "rejected")}
                                  disabled={actionLoading === p.id}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition border border-red-200 disabled:opacity-60 cursor-pointer font-medium"
                                  title={isRtl ? "رفض" : "Reject"}
                                >
                                  <span>{isRtl ? "رفض" : "Reject"}</span>
                                </button>
                              </>
                            )}

                            {p.rawStatus === "confirmed" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(p.id, "completed")}
                                  disabled={actionLoading === p.id}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition border border-teal-200 disabled:opacity-60 cursor-pointer font-medium"
                                  title={isRtl ? "إكمال الكشف" : "Complete Visit"}
                                >
                                  {actionLoading === p.id && <Loader2 size={12} className="animate-spin" />}
                                  <span>{isRtl ? "إكمال الكشف" : "Complete Visit"}</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(p.id, "cancelled")}
                                  disabled={actionLoading === p.id}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition border border-red-200 disabled:opacity-60 cursor-pointer font-medium"
                                  title={isRtl ? "إلغاء" : "Cancel"}
                                >
                                  <span>{isRtl ? "إلغاء" : "Cancel"}</span>
                                </button>
                              </>
                            )}

                            {/* Request access: only if confirmed & no access yet or rejected */}
                            {p.rawStatus === "confirmed" &&
                              (!p.prescriptionAccess || p.prescriptionAccess === "rejected") && (
                                <button
                                  onClick={() => handleRequestAccess(p.id)}
                                  disabled={actionLoading === p.id}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition border border-amber-200 disabled:opacity-60 cursor-pointer"
                                  title={t("doctorDashPages.todayAppointments.requestAccess", locale)}
                                >
                                  {actionLoading === p.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Clock size={12} />
                                  )}
                                  <span>{t("doctorDashPages.todayAppointments.requestAccess", locale)}</span>
                                </button>
                              )}

                            {/* Write prescription: only if access accepted */}
                            {p.rawStatus === "confirmed" &&
                              p.prescriptionAccess === "accepted" && (
                                <button
                                  onClick={() =>
                                    openPrescriptionModal(p.id, p.name)
                                  }
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition border border-green-200 cursor-pointer"
                                  title={t("doctorDashPages.todayAppointments.prescription", locale)}
                                >
                                  <Plus size={12} />
                                  <span>{t("doctorDashPages.todayAppointments.prescription", locale)}</span>
                                </button>
                              )}

                            {/* View patient details */}
                            <button
                              onClick={() =>
                                router.push(
                                  `/doctorDash/pages/patients/${p.id}`,
                                )
                              }
                              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-(--semi-card-bg) text-(--text-secondary) hover:text-(--text-primary) transition border border-(--card-border) cursor-pointer"
                              title={t("doctorDashPages.todayAppointments.details", locale)}
                            >
                              <FileText size={12} />
                              <span>{t("doctorDashPages.todayAppointments.details", locale)}</span>
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
            <div className="mt-2 flex flex-col items-center justify-between gap-3 text-sm sm:mt-4 sm:flex-row sm:gap-4">
              <div className="order-2 flex max-w-full flex-wrap items-center justify-center gap-2 sm:order-1">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="flex cursor-pointer items-center justify-center rounded-md border border-(--input-border) p-1.5 text-2xl text-(--text-primary) transition hover:bg-(--semi-card-bg) disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isRtl ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
                </button>

                {getPages().map((p, i) => (
                  <button
                    key={i}
                    onClick={() => typeof p === "number" && setPage(p)}
                    disabled={p === "..."}
                    className={`px-3 py-1 rounded cursor-pointer transition ${
                      p === page
                        ? "bg-[#1F2B6C] text-white font-medium"
                        : p === "..."
                          ? "cursor-default text-gray-400"
                          : "border border-(--input-border) text-(--text-primary) hover:bg-(--semi-card-bg)"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={page === totalPages}
                  className="flex cursor-pointer items-center justify-center rounded-md border border-(--input-border) p-1.5 text-2xl text-(--text-primary) transition hover:bg-(--semi-card-bg) disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isRtl ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
                </button>
              </div>

              <p className="text-(--text-secondary) order-1 sm:order-2">
                {t("doctorDashPages.todayAppointments.showing", locale)
                  .replace("{from}", String(data.length > 0 ? (page - 1) * pageSize + 1 : 0))
                  .replace("{to}", String(Math.min(page * pageSize, data.length)))
                  .replace("{total}", String(data.length))}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Create Prescription Modal */}
      {prescriptionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 backdrop-blur-sm sm:p-4" dir={isRtl ? "rtl" : "ltr"}>
          <div className="max-h-[100dvh] w-full max-w-2xl overflow-y-auto bg-white shadow-2xl dark:bg-[#1a2744] sm:max-h-[90vh] sm:rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-white/10 sm:p-6">
              <button
                onClick={() =>
                  setPrescriptionModal({ open: false, bookingId: null, patientName: "" })
                }
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <X size={20} />
              </button>
              <div className="text-start">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                  {t("doctorDashPages.todayAppointments.modalTitle", locale)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t("doctorDashPages.todayAppointments.modalPatient", locale)}: {prescriptionModal.patientName}
                </p>
              </div>
            </div>

            {prescriptionSuccess ? (
              <div className="flex flex-col items-center gap-4 py-12 px-6">
                <CheckCircle size={56} className="text-green-500 animate-bounce" />
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t("doctorDashPages.todayAppointments.modalSuccess", locale)}
                </p>
              </div>
            ) : (
              <div className="space-y-5 p-4 sm:p-6">
                {/* Symptoms */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-start">
                    {t("doctorDashPages.todayAppointments.symptoms", locale)}
                  </label>
                  <textarea
                    value={prescriptionForm.symptoms}
                    onChange={(e) =>
                      setPrescriptionForm((f) => ({ ...f, symptoms: e.target.value }))
                    }
                    rows={2}
                    placeholder={t("doctorDashPages.todayAppointments.symptomsPlaceholder", locale)}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 resize-none text-start"
                  />
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-start">
                    {t("doctorDashPages.todayAppointments.diagnosis", locale)}
                  </label>
                  <textarea
                    value={prescriptionForm.diagnosis}
                    onChange={(e) =>
                      setPrescriptionForm((f) => ({ ...f, diagnosis: e.target.value }))
                    }
                    rows={2}
                    placeholder={t("doctorDashPages.todayAppointments.diagnosisPlaceholder", locale)}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 resize-none text-start"
                  />
                </div>

                {/* Medication */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-start">
                      {t("doctorDashPages.todayAppointments.medicationName", locale)}
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.medication_name}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, medication_name: e.target.value }))
                      }
                      placeholder={t("doctorDashPages.todayAppointments.medicationPlaceholder", locale)}
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 text-start"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-start">
                      {t("doctorDashPages.todayAppointments.dose", locale)}
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.dose}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, dose: e.target.value }))
                      }
                      placeholder={t("doctorDashPages.todayAppointments.dosePlaceholder", locale)}
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 text-start"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-start">
                      {t("doctorDashPages.todayAppointments.duration", locale)}
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.duration}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, duration: e.target.value }))
                      }
                      placeholder={t("doctorDashPages.todayAppointments.durationPlaceholder", locale)}
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 text-start"
                    />
                  </div>
                </div>

                {/* Tests */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-start">
                      {t("doctorDashPages.todayAppointments.testName", locale)}
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.test_name}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, test_name: e.target.value }))
                      }
                      placeholder={t("doctorDashPages.todayAppointments.testNamePlaceholder", locale)}
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 text-start"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-start">
                      {t("doctorDashPages.todayAppointments.testResult", locale)}
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.test_result}
                      onChange={(e) =>
                        setPrescriptionForm((f) => ({ ...f, test_result: e.target.value }))
                      }
                      placeholder={t("doctorDashPages.todayAppointments.testResultPlaceholder", locale)}
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 text-start"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-start">
                    {t("doctorDashPages.todayAppointments.notes", locale)}
                  </label>
                  <textarea
                    value={prescriptionForm.notes}
                    onChange={(e) =>
                      setPrescriptionForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    rows={3}
                    placeholder={t("doctorDashPages.todayAppointments.notesPlaceholder", locale)}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 resize-none text-start"
                  />
                </div>

                {prescriptionError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-red-700 text-sm">
                    <XCircle size={16} />
                    <span>{prescriptionError}</span>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={() =>
                      setPrescriptionModal({ open: false, bookingId: null, patientName: "" })
                    }
                    className="w-full rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 sm:w-auto"
                  >
                    {t("doctorDashPages.todayAppointments.cancel", locale)}
                  </button>
                  <button
                    onClick={handleCreatePrescription}
                    disabled={prescriptionSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F2B6C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#162056] disabled:opacity-60 sm:w-auto"
                  >
                    {prescriptionSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {t("doctorDashPages.todayAppointments.sending", locale)}
                      </>
                    ) : (
                      t("doctorDashPages.todayAppointments.savePrescription", locale)
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
