"use client";

import React from "react";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

type Patient = {
  name: string;
  gender: string;
  department: string;
  date: string;
};

const getDeptColor = (dept: string) => {
  if (!dept) return "bg-gray-100 text-gray-600";
  const d = dept.toLowerCase();
  if (d.includes("عظام") || d.includes("orthopedics")) return "bg-orange-100 text-orange-600";
  if (d.includes("قلب") || d.includes("cardiology")) return "bg-blue-100 text-blue-600";
  if (d.includes("جلد") || d.includes("dermatology")) return "bg-purple-100 text-purple-600";
  return "bg-gray-100 text-gray-600";
};

export default function PatientsTable({ patients }: { patients?: Patient[] }) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const rows = patients ?? [];

  const getGenderTranslated = (gender: string) => {
    if (!gender) return "—";
    const g = gender.toLowerCase();
    if (g === "ذكر" || g === "male") return t("doctorDash.male", locale);
    if (g === "أنثى" || g === "female") return t("doctorDash.female", locale);
    return gender;
  };

  return (
    <div 
      className="bg-(--card-bg) rounded-2xl shadow-[var(--shadow-soft)] border border-(--card-border) w-full"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-(--card-border) mb-4 p-4 gap-3">
        <button className="w-full sm:w-auto border border-(--card-border) px-3 py-1.5 rounded-xl text-xs text-(--text-primary) font-medium cursor-pointer hover:text-white hover:bg-[color:var(--primary)] transition-colors duration-300">
          {t("doctorDash.showAll", locale)}
        </button>

        <h1 className="text-lg font-semibold text-(--text-primary)">
          {t("doctorDash.patientRegistry", locale)}
        </h1>
      </div>

      {/* Table */}
      <div className="p-4">
        <div className="overflow-hidden rounded-xl border border-(--card-border)">
          {/* Mobile */}
          <div className="sm:hidden space-y-3 p-4">
            {rows.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--card-border) p-6 text-center">
                <p className="text-sm font-semibold text-(--text-primary)">
                  {t("doctorDash.noPatientsYet", locale)}
                </p>
                <p className="text-xs text-(--text-secondary)">
                  {t("doctorDash.firstPatientDesc", locale)}
                </p>
              </div>
            )}
            {rows.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 ltr:flex-row-reverse">
                    <p className="text-sm font-semibold text-(--text-primary)">
                      {item.name}
                    </p>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getDeptColor(
                        item.department,
                      )}`}
                    >
                      {item.department}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-(--text-secondary) ltr:text-left rtl:text-right">
                    <span className="font-medium text-(--text-primary)">
                      {t("doctorDash.gender", locale)}
                    </span>
                    <span>{getGenderTranslated(item.gender)}</span>

                    <span className="font-medium text-(--text-primary)">
                      {t("doctorDash.lastVisit", locale)}
                    </span>
                    <span>{item.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <p className="text-sm font-semibold text-(--text-primary)">
                  {t("doctorDash.noPatientsYet", locale)}
                </p>
                <p className="text-xs text-(--text-secondary)">
                  {t("doctorDash.firstPatientDesc", locale)}
                </p>
              </div>
            ) : (
              <table className="w-full min-w-max text-xs sm:text-sm text-right ltr:text-left">
                <thead className="bg-(--hover-bg) text-(--text-secondary) text-[11px] sm:text-xs">
                  <tr>
                    <th className="px-3 py-2">{t("doctorDash.lastVisit", locale)}</th>
                    <th className="px-3 py-2">{t("doctorDash.departments", locale)}</th>
                    <th className="px-3 py-2">{t("doctorDash.gender", locale)}</th>
                    <th className="px-3 py-2">{t("doctorDash.patientName", locale)}</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((item, index) => (
                    <tr
                      key={index}
                      className="border-t border-(--card-border) hover:bg-(--hover-bg) transition"
                    >
                      <td className="px-3 py-2 text-(--text-secondary)">
                        {item.date}
                      </td>

                      <td className="px-3 py-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getDeptColor(
                            item.department,
                          )}`}
                        >
                          {item.department}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-(--text-secondary)">
                        {getGenderTranslated(item.gender)}
                      </td>

                      <td className="px-3 py-2 font-medium text-(--text-primary)">
                        {item.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
