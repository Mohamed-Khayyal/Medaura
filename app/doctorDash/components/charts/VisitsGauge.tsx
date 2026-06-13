"use client";
import React from "react";
import { Mars, Venus } from "lucide-react";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

type Props = {
  male: number;
  female: number;
  total: number;
};

export default function VisitsGauge({ male, female, total }: Props) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const size = 220;
  const center = size / 2;
  const outerRadius = 100;
  const innerRadius = 84;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  const malePercent = male / 100;
  const femalePercent = female / 100;

  const maleFilled = Math.round(malePercent * outerCircumference);
  const maleUnfilled = Math.round(outerCircumference - maleFilled);

  const femaleFilled = Math.round(femalePercent * innerCircumference);
  const femaleUnfilled = Math.round(innerCircumference - femaleFilled);

  return (
    <div 
      className="bg-(--card-bg) border border-(--card-border) h-fit rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-(--card-border) mb-4 p-4">
        <button className="w-full sm:w-auto border border-(--card-border) px-3 py-1.5 rounded-xl text-xs text-(--text-primary) font-medium cursor-pointer hover:text-white hover:bg-[color:var(--primary)] transition-colors duration-300">
          {t("doctorDash.showAll", locale)}
        </button>

        <h3 className="text-lg font-semibold text-(--text-primary)">
          {t("doctorDash.patientVisits", locale)}
        </h3>
      </div>

      <div className="flex justify-center p-4">
        <div className="w-full max-w-75">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
            <defs>
              <mask id="maskMale">
                <circle
                  cx={center}
                  cy={center}
                  r={outerRadius}
                  stroke="white"
                  fill="none"
                  strokeWidth="10"
                  strokeDasharray={outerCircumference}
                  strokeDashoffset={maleUnfilled}
                  transform={`rotate(-210 ${center} ${center})`}
                />
              </mask>

              <mask id="maskFemale">
                <circle
                  cx={center}
                  cy={center}
                  r={innerRadius}
                  stroke="white"
                  fill="none"
                  strokeWidth="10"
                  strokeDasharray={innerCircumference}
                  strokeDashoffset={femaleUnfilled}
                  transform={`rotate(-210 ${center} ${center})`}
                />
              </mask>
            </defs>

            <circle
              cx={center}
              cy={center}
              r={outerRadius}
              stroke="#1F6DB2"
              strokeLinecap="butt"
              fill="none"
              strokeWidth="10"
              strokeDasharray="9 8"
              mask="url(#maskMale)"
              transform={`rotate(-367 ${center} ${center})`}
            />

            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              stroke="#6A1B9A"
              fill="none"
              strokeWidth="10"
              strokeDasharray="9 8"
              mask="url(#maskFemale)"
              transform={`rotate(-367 ${center} ${center})`}
            />

            <text
              x={center}
              y={center - 22}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              fill="var(--text-secondary)"
              fontWeight="semibold"
            >
              {t("doctorDash.allPatients", locale)}
            </text>

            <text
              x={center}
              y={center + 22}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="24"
              fill="var(--text-primary)"
              fontWeight="bold"
            >
              {total}%
            </text>
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* male */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold text-(--text-primary)">{male}%</h3>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className={isRtl ? "text-right" : "text-left"}>
              <p className="font-semibold text-(--text-primary)">{t("doctorDash.male", locale)}</p>

              <div className="flex items-center gap-2 font-medium">
                <p className="text-xs text-(--text-secondary)">
                  {t("doctorDash.sinceLastWeek", locale)}
                </p>
                <span className="text-emerald-600">-15%</span>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-[#1F6DB2] flex items-center justify-center shrink-0">
              <Mars size={20} strokeWidth={2} className="text-white" />
            </div>
          </div>
        </div>

        {/* female */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold text-(--text-primary)">{female}%</h3>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className={isRtl ? "text-right" : "text-left"}>
              <p className="font-semibold text-(--text-primary)">{t("doctorDash.female", locale)}</p>

              <div className="flex items-center gap-2 font-medium">
                <p className="text-xs text-(--text-secondary)">
                  {t("doctorDash.sinceLastWeek", locale)}
                </p>
                <span className="text-emerald-600">-15%</span>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-[#6A1B9A] flex items-center justify-center shrink-0">
              <Venus size={20} strokeWidth={2} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
