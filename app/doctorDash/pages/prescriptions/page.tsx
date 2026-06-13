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
  Printer,
  Hospital,
} from "lucide-react";
import type { Prescription } from "@/lib/types/api";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

function formatDate(value?: string | null, locale = "en") {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PrescriptionCard({ rx }: { rx: Prescription }) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <div
      className="min-w-0 space-y-4 rounded-2xl border border-(--card-border) bg-(--card-bg) p-4 sm:p-5"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0 text-start">
          <p className="text-sm text-(--text-secondary)">{t("doctorDash.prescriptionNumber", locale)}</p>
          <p className="break-all text-lg font-bold text-(--text-primary)">
            #{rx.prescription_id || rx.id}
          </p>
        </div>
        <div className="min-w-0 text-start sm:text-end">
          <p className="text-sm text-(--text-secondary)">{t("doctorDash.createdDate", locale)}</p>
          <p className="break-words text-sm font-medium text-(--text-primary)">
            {formatDate(rx.created_at, locale)}
          </p>
        </div>
      </div>

      <div className="border-t border-(--card-border)/60" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Patient */}
        {rx.patient_name && (
          <div className="flex min-w-0 items-center gap-2 text-start">
            <User size={15} className="text-(--text-secondary) shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-(--text-secondary)">{t("doctorDash.patient", locale)}</p>
              <p className="break-words text-sm font-medium text-(--text-primary)">{rx.patient_name}</p>
            </div>
          </div>
        )}

        {/* Visit date */}
        {rx.booking_date && (
          <div className="flex min-w-0 items-center gap-2 text-start">
            <Calendar size={15} className="text-(--text-secondary) shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-(--text-secondary)">{t("doctorDash.visitDate", locale)}</p>
              <p className="text-sm font-medium text-(--text-primary)">
                {formatDate(rx.booking_date, locale)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Medical details */}
      <div className="space-y-2.5">
        {rx.symptoms && (
          <div className="rounded-xl bg-(--semi-card-bg) p-3 text-right ltr:text-left">
            <p className="text-xs font-semibold text-(--text-secondary) mb-1">{t("doctorDash.symptoms", locale)}</p>
            <p className="text-sm text-(--text-primary)">{rx.symptoms}</p>
          </div>
        )}
        {rx.diagnosis && (
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 text-right ltr:text-left">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center justify-end ltr:justify-start gap-1">
              <Stethoscope size={12} />
              {t("doctorDash.diagnosis", locale)}
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-200">{rx.diagnosis}</p>
          </div>
        )}
        {rx.medication_name && (
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-right ltr:text-left">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center justify-end ltr:justify-start gap-1">
              <Pill size={12} />
              {t("doctorDash.medication", locale)}
            </p>
            <p className="text-sm text-green-900 dark:text-green-200">
              {rx.medication_name}
              {rx.dose && <span className="text-green-600 dark:text-green-400"> — {rx.dose}</span>}
              {rx.duration && (
                <span className="text-green-600 dark:text-green-400"> {isRtl ? `لمدة ${rx.duration}` : `for ${rx.duration}`}</span>
              )}
            </p>
          </div>
        )}
        {rx.test_name && (
          <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-3 text-right ltr:text-left">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1 flex items-center justify-end ltr:justify-start gap-1">
              <FlaskConical size={12} />
              {t("doctorDash.tests", locale)}
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
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-right ltr:text-left">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center justify-end ltr:justify-start gap-1">
              <StickyNote size={12} />
              {t("doctorDash.notes", locale)}
            </p>
            <p className="text-sm text-amber-900 dark:text-amber-200">{rx.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrescriptionsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
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
        setError(result.error || t("doctorDash.loadingReport", locale));
        return;
      }

      setPrescriptions(Array.isArray(result.data) ? result.data : []);
    } catch {
      setError(isRtl ? "حدث خطأ في الاتصال" : "Connection error occurred");
    } finally {
      setLoading(false);
    }
  }, [locale, isRtl]);

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

  const displayDoctorName = selected?.provider_name || t("dashboard.header.doctor", locale);

  return (
    <div
      className="min-w-0 space-y-5 px-2 py-3 sm:space-y-6 sm:px-4 sm:py-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="order-2 sm:order-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <FileText size={13} />
            {t("doctorDash.prescriptionsCount", locale).replace("{count}", String(prescriptions.length))}
          </span>
        </div>
        <div className="order-1 min-w-0 text-start sm:order-2">
          <h1 className="text-xl font-bold text-(--text-primary) sm:text-2xl">
            {t("doctorDash.prescriptionsTitle", locale)}
          </h1>
          <p className="text-sm text-(--text-secondary) mt-1">
            {t("doctorDash.prescriptionsDesc", locale)}
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
          placeholder={t("doctorDash.searchPrescriptionsPlaceholder", locale)}
          dir={isRtl ? "rtl" : "ltr"}
          className="w-full rounded-2xl border border-(--input-border) bg-(--input-bg) px-5 py-3 text-sm text-(--text-primary) outline-none focus:border-[#1F2B6C] focus:ring-2 focus:ring-[#1F2B6C]/10 transition text-right ltr:text-left"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-(--text-secondary)">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p>{t("doctorDash.loadingPrescriptions", locale)}</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-center text-red-700 dark:text-red-400">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-(--text-secondary)">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">
            {searchQuery ? t("clinicDash.noResults", locale).replace("{query}", searchQuery) : t("doctorDash.noPrescriptions", locale)}
          </p>
          <p className="text-sm mt-2 opacity-70">
            {searchQuery
              ? t("clinicDash.tryDifferentName", locale)
              : t("doctorDash.noPrescriptionsDesc", locale)}
          </p>
        </div>
      ) : (
        <>
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
            {paginated.map((rx) => (
              <div
                key={rx.prescription_id || rx.id}
                className="min-w-0 cursor-pointer transition-transform hover:scale-[1.01]"
                onClick={() => setSelected(rx)}
              >
                <PrescriptionCard rx={rx} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex max-w-full flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex items-center justify-center border border-(--input-border) rounded-lg p-2 hover:bg-(--semi-card-bg) transition disabled:opacity-40"
              >
                {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
                {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail & Print Modal */}
      {selected && (
        <div
          className="print-modal-container fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-4"
          onClick={() => setSelected(null)}
        >
          {/* Global print style block injection */}
          <style dangerouslySetInnerHTML={{ __html: `
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            @media print {
              html, body {
                width: auto !important;
                min-height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body {
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Hide all page layout elements */
              body * {
                visibility: hidden !important;
              }
              /* Show ONLY the printable container and descendants */
              #printable-prescription-card, #printable-prescription-card * {
                visibility: visible !important;
              }
              #printable-prescription-card {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: none !important;
                min-height: 0 !important;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-sizing: border-box !important;
              }
              #printable-prescription-card * {
                box-sizing: border-box !important;
                max-width: 100% !important;
              }
              #printable-prescription-card .print-metadata {
                display: grid !important;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
                gap: 12px 20px !important;
              }
              #printable-prescription-card .print-break {
                overflow-wrap: anywhere !important;
                word-break: break-word !important;
                white-space: normal !important;
              }
              #printable-prescription-card .print-clinical > div,
              #printable-prescription-card .print-signature {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              .no-print, .print-modal-header {
                display: none !important;
                visibility: hidden !important;
              }
            }
          `}} />

          <div
            className="print-modal-content flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-[#1a2744] sm:max-h-[90vh] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? "rtl" : "ltr"}
          >
            {/* Modal Actions Header */}
            <div className="print-modal-header flex items-center justify-between border-b border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-gray-800/50 sm:p-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 rounded-xl bg-[#1F2B6C] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#151F52] sm:px-4 sm:text-sm"
                >
                  <Printer size={16} />
                  {t("doctorDash.printReport", locale)}
                </button>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Printable sheet */}
            <div className="print-modal-body flex-1 overflow-y-auto bg-gray-100 p-3 dark:bg-gray-950/20 sm:p-6">
              <div
                id="printable-prescription-card"
                className="mx-auto w-full max-w-lg rounded-xl border border-gray-200 bg-white p-4 font-sans text-black shadow-sm sm:p-8"
                dir={isRtl ? "rtl" : "ltr"}
              >
                {/* Official Header */}
                <div className="mb-6 flex items-center justify-between gap-4 border-b-2 border-[#1F2B6C] pb-4">
                  <div className={isRtl ? "text-right" : "text-left"}>
                    <h2 className="text-lg font-bold text-[#1F2B6C]">
                      {t("doctorDash.clinicName", locale)}
                    </h2>
                    <p className="text-xs text-gray-500">Medaura Health Platform</p>
                  </div>

                  <div className="w-12 h-12 bg-white flex items-center justify-center border border-gray-200 rounded-lg p-1 shrink-0">
                    <img src="/images/LOGO.png" alt="Medaura Logo" className="w-full h-full object-contain" />
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                  <h3 className="text-base font-bold uppercase tracking-wider text-gray-700 bg-gray-100 py-1.5 rounded-lg inline-block px-6">
                    {t("doctorDash.medicalReport", locale)}
                  </h3>
                </div>

                {/* Metadata Grid */}
                <div className="print-metadata mb-6 grid grid-cols-1 gap-4 border-b border-gray-100 pb-4 text-sm sm:grid-cols-2">
                  <div className={`min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
                    <p className="text-xs text-gray-400">{t("doctorDash.prescriptionNumber", locale)}</p>
                    <p className="print-break font-semibold text-gray-800">#{selected.prescription_id || selected.id}</p>
                  </div>

                  <div className={`min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
                    <p className="text-xs text-gray-400">{t("doctorDash.date", locale)}</p>
                    <p className="print-break font-semibold text-gray-800">{formatDate(selected.created_at, locale)}</p>
                  </div>

                  <div className={`min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
                    <p className="text-xs text-gray-400">{t("doctorDash.patient", locale)}</p>
                    <p className="print-break font-semibold text-gray-800">{selected.patient_name}</p>
                  </div>

                  <div className={`min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
                    <p className="text-xs text-gray-400">{t("doctorDash.doctor", locale)}</p>
                    <p className="print-break font-semibold text-gray-800">{displayDoctorName}</p>
                  </div>
                </div>

                {/* Clinical content */}
                <div className="print-clinical space-y-4 text-sm">
                  {/* Symptoms */}
                  {selected.symptoms && (
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {t("doctorDash.symptoms", locale)}
                      </h4>
                      <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                        {selected.symptoms}
                      </p>
                    </div>
                  )}

                  {/* Diagnosis */}
                  {selected.diagnosis && (
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {t("doctorDash.diagnosis", locale)}
                      </h4>
                      <p className="text-gray-800 font-semibold bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/30 leading-relaxed">
                        {selected.diagnosis}
                      </p>
                    </div>
                  )}

                  {/* Medication */}
                  {selected.medication_name && (
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {t("doctorDash.medication", locale)}
                      </h4>
                      <div className="bg-green-50/35 p-3 rounded-lg border border-green-100/30">
                        <p className="font-bold text-green-900 text-sm">
                          {selected.medication_name}
                        </p>
                        {(selected.dose || selected.duration) && (
                          <p className="text-xs text-green-700 mt-1">
                            {selected.dose} {selected.duration ? `— ${selected.duration}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tests */}
                  {selected.test_name && (
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {t("doctorDash.tests", locale)}
                      </h4>
                      <p className="text-gray-700 bg-purple-50/30 p-2.5 rounded-lg border border-purple-100/30">
                        {selected.test_name} {selected.test_result ? `— ${selected.test_result}` : ""}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {selected.notes && (
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {t("doctorDash.notes", locale)}
                      </h4>
                      <p className="text-xs text-gray-600 bg-amber-50/30 p-2.5 rounded-lg border border-amber-100/30 whitespace-pre-line">
                        {selected.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sign-off */}
                <div className="print-signature mt-10 flex justify-end border-t border-gray-100 pt-6">
                  <div className="text-center w-56">
                    <p className="text-xs text-gray-400">
                      {isRtl ? "توقيع الطبيب" : "Doctor's Signature"}
                    </p>
                    <div className="h-10 my-2 flex items-center justify-center">
                      <span className="font-serif italic text-blue-900 text-lg font-semibold">
                        {displayDoctorName}
                      </span>
                    </div>
                    <div className="border-b border-gray-300 w-full" />
                    <p className="text-xs font-semibold text-gray-700 mt-1">
                      {displayDoctorName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
