"use client";

import { Hospital, Download, X, Printer } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

interface Clinic {
  id: number | string;
  name: string;
  status: "available" | "busy";
  description?: string;
}

export default function ClinicsList({ 
  reports, 
  doctorName 
}: { 
  reports?: Clinic[];
  doctorName?: string;
}) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const rows = reports ?? [];

  const [selectedReport, setSelectedReport] = useState<Clinic | null>(null);
  const [fullPrescription, setFullPrescription] = useState<any | null>(null);
  const [fetching, setFetching] = useState(false);

  const handleOpenReport = async (report: Clinic) => {
    setSelectedReport(report);
    setFullPrescription(null);
    setFetching(true);
    try {
      const response = await fetch("/api/prescriptions/my-prescriptions");
      const result = await response.json();
      if (response.ok && result.success && Array.isArray(result.data)) {
        const found = result.data.find(
          (rx: any) => String(rx.prescription_id || rx.id) === String(report.id)
        );
        if (found) {
          setFullPrescription(found);
        }
      }
    } catch (err) {
      console.error("Failed to load report details", err);
    } finally {
      setFetching(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US");
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const displayDoctorName = fullPrescription?.doctor_name || doctorName || t("dashboard.header.doctor", locale);

  return (
    <div 
      className="bg-(--card-bg) h-auto rounded-2xl shadow-[var(--shadow-soft)] border border-(--card-border)"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-(--card-border) mb-4 p-4">
        <button className="w-full sm:w-auto border border-(--card-border) px-3 py-1.5 rounded-xl text-xs text-(--text-primary) font-medium cursor-pointer hover:text-white hover:bg-[color:var(--primary)] transition-colors duration-300">
          {t("doctorDash.showAll", locale)}
        </button>

        <h1 className="text-lg font-semibold text-(--text-primary)">
          {t("doctorDash.patientReport", locale)}
        </h1>
      </div>

      {/* clinics */}
      <div className="space-y-2.5 px-4 sm:px-5 py-2 pb-4">
        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--card-border) p-8 text-center">
            <p className="text-sm font-semibold text-(--text-primary)">
              {t("doctorDash.noReports", locale)}
            </p>
            <p className="text-xs text-(--text-secondary)">
              {t("doctorDash.noReportsDesc", locale)}
            </p>
          </div>
        )}
        {rows.slice(0, 7).map((clinic) => (
          <div
            key={clinic.id}
            className="flex items-center justify-between p-3 bg-(--semi-card-bg) rounded-2xl hover:bg-(--hover-bg) transition-colors"
          >
            {/* Clinic Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                <Hospital
                  size={18}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>

              <div className="min-w-0 flex-1 ltr:text-left rtl:text-right">
                <p className="font-semibold text-(--text-primary) text-sm truncate">
                  {clinic.name}
                </p>

                <p className="text-[11px] text-(--text-secondary)">
                  {clinic.description || t("doctorDash.defaultReportDesc", locale)}
                </p>
              </div>
            </div>

            {/* Download/Preview Button */}
            <button 
              onClick={() => handleOpenReport(clinic)}
              className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shrink-0 cursor-pointer"
            >
              <Download
                size={16}
                strokeWidth={1.5}
                className="text-blue-600 dark:text-blue-400"
              />
            </button>
          </div>
        ))}
      </div>

      {/* Preview and Print Modal */}
      {selectedReport && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print-modal-container"
          onClick={() => setSelectedReport(null)}
        >
          {/* Global print style block injection */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body {
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Hide all components from layout */
              body * {
                visibility: hidden !important;
              }
              /* Show ONLY the printable report card and its internal children */
              #printable-report-card, #printable-report-card * {
                visibility: visible !important;
              }
              #printable-report-card {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
                border: none !important;
                padding: 10px !important;
                margin: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print, .print-modal-header {
                display: none !important;
                visibility: hidden !important;
              }
            }
          `}} />

          <div 
            className="bg-white dark:bg-[#1a2744] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col print-modal-content"
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? "rtl" : "ltr"}
          >
            {/* Modal Actions Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800/50 print-modal-header">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-[#1F2B6C] hover:bg-[#151F52] text-white px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  <Printer size={16} />
                  {t("doctorDash.printReport", locale)}
                </button>
              </div>

              <button 
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-100 dark:bg-gray-950/20 print-modal-body">
              {fetching ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F2B6C] mb-4"></div>
                  <p className="text-sm">{t("doctorDash.loadingReport", locale)}</p>
                </div>
              ) : (
                /* Report Sheet */
                <div 
                  id="printable-report-card" 
                  className="bg-white text-black p-8 rounded-xl shadow-sm border border-gray-200 w-full font-sans max-w-lg mx-auto"
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  {/* Official Header */}
                  <div className="flex items-center justify-between border-b-2 border-[#1F2B6C] pb-4 mb-6">
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
                  <div className="grid grid-cols-2 gap-4 mb-6 border-b border-gray-100 pb-4 text-sm">
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <p className="text-xs text-gray-400">{t("doctorDash.reportId", locale)}</p>
                      <p className="font-semibold text-gray-800">#{selectedReport.id}</p>
                    </div>

                    <div className={isRtl ? "text-right" : "text-left"}>
                      <p className="text-xs text-gray-400">{t("doctorDash.date", locale)}</p>
                      <p className="font-semibold text-gray-800">{formatDate(fullPrescription?.created_at)}</p>
                    </div>

                    <div className={isRtl ? "text-right" : "text-left"}>
                      <p className="text-xs text-gray-400">{t("doctorDash.patient", locale)}</p>
                      <p className="font-semibold text-gray-800">{selectedReport.name}</p>
                    </div>

                    <div className={isRtl ? "text-right" : "text-left"}>
                      <p className="text-xs text-gray-400">{t("doctorDash.doctor", locale)}</p>
                      <p className="font-semibold text-gray-800">{displayDoctorName}</p>
                    </div>
                  </div>

                  {/* Clinical content */}
                  <div className="space-y-4 text-sm">
                    {/* Symptoms */}
                    {fullPrescription?.symptoms && (
                      <div className={isRtl ? "text-right" : "text-left"}>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {t("doctorDash.symptoms", locale)}
                        </h4>
                        <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                          {fullPrescription.symptoms}
                        </p>
                      </div>
                    )}

                    {/* Diagnosis */}
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {t("doctorDash.diagnosis", locale)}
                      </h4>
                      <p className="text-gray-800 font-semibold bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/30 leading-relaxed">
                        {fullPrescription?.diagnosis || selectedReport.description}
                      </p>
                    </div>

                    {/* Medication */}
                    {fullPrescription?.medication_name && (
                      <div className={isRtl ? "text-right" : "text-left"}>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {t("doctorDash.medication", locale)}
                        </h4>
                        <div className="bg-green-50/35 p-3 rounded-lg border border-green-100/30">
                          <p className="font-bold text-green-900 text-sm">
                            {fullPrescription.medication_name}
                          </p>
                          {(fullPrescription.dose || fullPrescription.duration) && (
                            <p className="text-xs text-green-700 mt-1">
                              {fullPrescription.dose} {fullPrescription.duration ? `— ${fullPrescription.duration}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tests */}
                    {fullPrescription?.test_name && (
                      <div className={isRtl ? "text-right" : "text-left"}>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {t("doctorDash.tests", locale)}
                        </h4>
                        <p className="text-gray-700 bg-purple-50/30 p-2.5 rounded-lg border border-purple-100/30">
                          {fullPrescription.test_name} {fullPrescription.test_result ? `— ${fullPrescription.test_result}` : ""}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {fullPrescription?.notes && (
                      <div className={isRtl ? "text-right" : "text-left"}>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {t("doctorDash.notes", locale)}
                        </h4>
                        <p className="text-xs text-gray-600 bg-amber-50/30 p-2.5 rounded-lg border border-amber-100/30 whitespace-pre-line">
                          {fullPrescription.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sign-off */}
                  <div className="mt-10 border-t border-gray-100 pt-6 flex justify-end">
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
