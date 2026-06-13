"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

interface TodayProgressProps {
  todayAppointments?: any[];
}

type Status = 1 | 2 | 3;

function timeToDate(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function isInRange(start: string, end: string) {
  const now = Date.now();
  const s = timeToDate(start).getTime();
  const e = timeToDate(end).getTime();
  return now >= s && now <= e;
}

export default function TodaySchedule({ todayAppointments = [] }: TodayProgressProps) {
  const [now, setNow] = useState(new Date());
  const locale = useLocale();
  const isRtl = locale === "ar";

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const appointments = useMemo(() => {
    if (!todayAppointments || todayAppointments.length === 0) {
      return [
        {
          title: t("doctorDashPages.appointmentsTable.noAppointments", locale) || (isRtl ? "لا توجد مواعيد اليوم" : "No appointments today"),
          start: "09:00",
          end: "17:00",
          status: 3 as Status,
        }
      ];
    }
    return todayAppointments.map((app, index) => {
      const startTime = app.time || "09:00";
      const [h, m] = startTime.split(":").map(Number);
      const endH = m + 30 >= 60 ? (h + 1) % 24 : h;
      const endM = (m + 30) % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      
      return {
        title: isRtl ? `حجز ${app.name}` : `Booking ${app.name}`,
        start: startTime,
        end: endTime,
        status: ((index % 3) + 1) as Status,
      };
    });
  }, [todayAppointments, locale, isRtl]);

  const liveStatus: Status = useMemo(() => {
    const found = appointments.find(a => 
      isInRange(a.start, a.end)
    );

    return found?.status as Status ?? 1 as Status;
  }, [appointments, now]);

  const progress = useMemo(() => {
    if (!todayAppointments || todayAppointments.length === 0) return 0;

    const total = appointments.reduce((acc, a) => {
      const start = timeToDate(a.start).getTime();
      const end = timeToDate(a.end).getTime();
      return acc + (end - start);
    }, 0);

    const passed = appointments.reduce((acc, a) => {
      const start = timeToDate(a.start).getTime();
      const end = timeToDate(a.end).getTime();
      const current = now.getTime();

      if (current >= end) return acc + (end - start);
      if (current > start) return acc + (current - start);
      return acc;
    }, 0);

    return Math.min(Math.round((passed / total) * 100), 100);
  }, [appointments, now, todayAppointments]);

  const today = new Date();

  const formattedDate = today.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const colors: Record<Status, string> = {
    1: "#09800F",
    2: "#001A6E",
    3: "#828798",
  };

  return (
    <div className="h-full w-full min-w-0 rounded-2xl border border-(--card-border) bg-(--card-bg) p-4 sm:p-6" dir={isRtl ? "rtl" : "ltr"}>

      {/* Header */}
      <div className={`mb-4 ${isRtl ? "text-right" : "text-left"}`}>
        <h2 className="font-bold text-lg sm:text-xl">
          {isRtl ? "جدول اليوم" : "Today's Schedule"}
        </h2>
        <p className={`text-xs sm:text-sm text-(--text-secondary) flex items-center gap-2 ${isRtl ? "justify-end" : "justify-start"}`}>
          {!isRtl && (
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colors[liveStatus] }}
            />
          )}
          {formattedDate}
          {isRtl && (
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colors[liveStatus] }}
            />
          )}
        </p>
      </div>

      {/* Circle */}
      <div className="flex justify-center mb-6 relative">
        <div className="w-37.5 sm:w-45 aspect-square">
          <svg viewBox="0 0 180 180" className="w-full h-full">
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="var(--card-bg)"
              strokeWidth="14"
              fill="none"
            />
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke={colors[liveStatus]}
              strokeWidth="20"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
              style={{ transition: "stroke-dashoffset 0.7s ease" }}
            />
          </svg>
        </div>

        {/* center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg sm:text-xl font-semibold">{progress}%</span>
          <span className="text-[10px] sm:text-xs text-gray-500">
            {isRtl ? "إنجاز يومي" : "Daily Progress"}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className={`space-y-3 sm:space-y-4 ${isRtl ? "text-right" : "text-left"}`}>
        {appointments.map((a, i) => {
          return (
            <div key={i} className={`flex items-start gap-3 ${isRtl ? "justify-end" : "justify-start"}`}>
              {!isRtl && (
                <span
                  className="w-2.5 h-2.5 mt-1.5 rounded-full"
                  style={{ backgroundColor: colors[a.status as Status] }}
                />
              )}

              <div>
                <p className="text-sm sm:text-base font-medium text-(--text-primary)">
                  {a.title}
                </p>
                <p
                  className={`text-xs sm:text-sm font-semibold text-(--text-secondary) ${
                    isInRange(a.start, a.end) ? "text-(--text2-bg)" : ""
                  }`}
                >
                  {isInRange(a.start, a.end)
                    ? (isRtl ? "الآن" : "Now")
                    : `${a.start} - ${a.end}`}
                </p>
              </div>

              {isRtl && (
                <span
                  className="w-2.5 h-2.5 mt-1.5 rounded-full"
                  style={{ backgroundColor: colors[a.status as Status] }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
