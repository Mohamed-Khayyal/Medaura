"use client";

import { useState, useMemo } from "react";
import { Clock } from "lucide-react";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

type TodayAppointment = {
  id?: number;
  name: string;
  type: string;
  date: string;
  time: string;
};

export default function TodayAppointments({
  appointments: appointmentsProp,
}: {
  appointments?: TodayAppointment[];
}) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const rows = appointmentsProp ?? [];
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0],
  );

  const filtered = useMemo(() => {
    return rows
      .filter((a) => a.date === selectedDate)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [rows, selectedDate]);

  const currentTime = new Date().toTimeString().slice(0, 5);

  const getStatus = (time: string) => {
    return time <= currentTime ? t("doctorDash.ongoingExam", locale) : null;
  };

  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return { start, end };
  };

  const { start, end } = getWeekRange(currentDate);

  const formatRange = () => {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      year: "numeric",
    };

    return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString(
      locale === "ar" ? "ar-EG" : "en-US",
      options,
    )}`;
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    return {
      day: d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "short" }),
      date: d.toISOString().split("T")[0],
      num: d.getDate(),
    };
  });

  const getAppointmentTypeTranslated = (type: string) => {
    if (!type) return "";
    const lower = type.toLowerCase();
    if (lower === "زيارة" || lower === "visit") return t("doctorDash.visit", locale);
    if (lower === "استشارة" || lower === "consultation") return t("doctorDash.consultation", locale);
    if (lower === "طوارئ" || lower === "emergency") return t("doctorDash.emergency", locale);
    return type;
  };

  return (
    <div 
      className="flex flex-col bg-(--card-bg) rounded-2xl border border-(--card-border) shadow-[var(--shadow-soft)] w-full h-155"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-(--card-border) mb-4 p-4">
        <button className="w-full sm:w-auto border border-(--card-border) px-3 py-1.5 rounded-xl text-xs sm:text-sm text-(--text-primary) font-medium cursor-pointer hover:text-white hover:bg-[color:var(--primary)] transition-colors duration-300">
          {t("doctorDash.allAppointments", locale)}
        </button>

        <h1 className="text-lg font-semibold text-(--text-primary)">
          {t("doctorDash.todayAppointments", locale)}
        </h1>
      </div>

      {/* Appointments */}
      <div className="space-y-3 flex-1 overflow-y-auto scroll px-4 pb-4">
        {filtered.length === 0 && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-semibold text-(--text-primary)">
                {t("doctorDash.noTodayAppointments", locale)}
              </p>
              <p className="text-[11px] text-(--text-secondary)">
                {t("doctorDash.noTodayAppointmentsDesc", locale)}
              </p>
            </div>
          </div>
        )}

        {filtered.map((item, i) => {
          const status = getStatus(item.time);

          return (
            <div
              key={item.id || i}
              className="flex justify-between items-center"
            >
              {/* Time */}
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                {status ? (
                  <span className="text-[11px] bg-green-100 text-green-600 px-2 py-0.5 rounded mt-1 inline-block">
                    {status}
                  </span>
                ) : (
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Clock size={14} className=" text-(--text-secondary) " />
                    <span className=" text-(--text-secondary) ">
                      {item.time}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-right ltr:text-left">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-[11px] text-(--text-secondary)">
                  {getAppointmentTypeTranslated(item.type)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Week Navigation */}
      <div className="mt-auto px-4 pb-4">
        <div className="flex items-center justify-between mt-4">
          {/* Prev arrow */}
          <button
            onClick={prevWeek}
            className="text-base text-(--text-primary) cursor-pointer"
          >
            {isRtl ? "❯" : "❮"}
          </button>

          {/* Range */}
          <p className="text-xs font-semibold text-(--text-primary)">
            {formatRange()}
          </p>

          {/* Next arrow */}
          <button
            onClick={nextWeek}
            className="text-base text-(--text-primary) cursor-pointer"
          >
            {isRtl ? "❮" : "❯"}
          </button>
        </div>
        <div className="flex justify-between mt-4 text-[11px] text-(--text-primary)">
          {weekDays.map((d, i) => (
            <div
              key={i}
              onClick={() => setSelectedDate(d.date)}
              className={`cursor-pointer text-center
                ${d.date === selectedDate ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)] rounded-2xl p-1 -translate-y-3" : ""}`}
            >
              <p>{d.day}</p>

              <div
                className={`mt-1 w-8 h-8 flex items-center justify-center rounded-lg`}
              >
                {d.num}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
