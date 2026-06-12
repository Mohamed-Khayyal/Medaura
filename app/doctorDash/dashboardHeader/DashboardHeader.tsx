"use client";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/hooks";

type DateRange = {
  from?: Date;
  to?: Date;
};

const WEEK_LABELS_AR = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];
const WEEK_LABELS_EN = ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DashboardHeader({
  range,
  setRange,
}: {
  range: DateRange;
  setRange: (value: DateRange | undefined) => void;
}) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const WEEK_LABELS = isRtl ? WEEK_LABELS_AR : WEEK_LABELS_EN;
  const MONTHS = isRtl ? MONTHS_AR : MONTHS_EN;

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => range?.from ?? new Date());
  const [pendingRange, setPendingRange] = useState<DateRange>(range ?? {});
  const CalendarRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPendingRange(range ?? {});
  }, [range]);

  useEffect(() => {
    if (range?.from) {
      setViewDate(range.from);
    }
  }, [range?.from]);

  useEffect(() => {
    function handleClickOuside(event: MouseEvent) {
      const target = event.target as Node;
      if (modalRef.current && modalRef.current.contains(target)) return;
      if (CalendarRef.current && CalendarRef.current.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOuside);
    return () => {
      document.removeEventListener("mousedown", handleClickOuside);
    };
  }, []);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 6 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 6 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const handleSelect = (selected: Date) => {
    const { from, to } = pendingRange;
    if (!from) {
      setPendingRange({ from: selected, to: selected });
      return;
    }

    if (from && to) {
      if (!isSameDay(from, to)) {
        setPendingRange({ from: selected, to: selected });
        return;
      }

      if (isBefore(selected, from)) {
        setPendingRange({ from: selected, to: from });
        return;
      }

      if (isSameDay(selected, from)) {
        setPendingRange({ from: selected, to: selected });
        return;
      }

      setPendingRange({ from, to: selected });
      return;
    }

    if (isBefore(selected, from)) {
      setPendingRange({ from: selected, to: from });
    } else if (isSameDay(selected, from)) {
      setPendingRange({ from: selected, to: selected });
    } else {
      setPendingRange({ from, to: selected });
    }
  };

  const isInRange = (date: Date) => {
    if (!pendingRange.from || !pendingRange.to) return false;
    return (
      (isAfter(date, pendingRange.from) ||
        isSameDay(date, pendingRange.from)) &&
      (isBefore(date, pendingRange.to) || isSameDay(date, pendingRange.to))
    );
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-3 w-full sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-base sm:text-lg font-semibold text-(--text-primary)">
            {isRtl ? "نظرة عامة" : "Overview"}
          </h2>
          <p className="text-[11px] text-(--text-secondary)">
            {isRtl ? "متابعة الأداء والزيارات اليومية" : "Track performance and daily visits"}
          </p>
        </div>

        {/* Date section */}
        <div className="relative w-full sm:w-auto" ref={CalendarRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex w-full items-center justify-between gap-2 bg-(--card-bg) border border-(--card-border) px-3 py-1.5 rounded-xl shadow-[var(--shadow-soft)] cursor-pointer hover:bg-(--hover-bg) transition sm:min-w-[160px]"
          >
            <span className="text-[11px] text-(--text-primary) truncate max-w-[180px] sm:max-w-none">
              {range?.from && range?.to
                ? `${format(range.from, "dd MMM yyyy")} - ${format(range.to, "dd MMM yyyy")}`
                : (isRtl ? "إختر التاريخ" : "Choose date")}
            </span>
            <Calendar size={16} />
          </button>
          {open && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
              <div
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                dir={isRtl ? "rtl" : "ltr"}
              >
                <div
                  ref={modalRef}
                  className="w-[280px] sm:w-[320px] rounded-2xl border border-(--card-border) bg-(--card-bg) p-3 sm:p-4 shadow-[var(--shadow-hover)]"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-(--card-border)">
                    <button
                      onClick={() => setViewDate(addMonths(viewDate, -1))}
                      className="h-7 w-7 rounded-full border border-(--card-border) hover:bg-(--hover-bg) transition"
                      aria-label={isRtl ? "الشهر السابق" : "Previous month"}
                    >
                      {isRtl ? "◀" : "◀"}
                    </button>
                    <div className="text-xs font-semibold text-(--text-primary)">
                      {MONTHS[monthStart.getMonth()]} {monthStart.getFullYear()}
                    </div>
                    <button
                      onClick={() => setViewDate(addMonths(viewDate, 1))}
                      className="h-7 w-7 rounded-full border border-(--card-border) hover:bg-(--hover-bg) transition"
                      aria-label={isRtl ? "الشهر التالي" : "Next month"}
                    >
                      ▶
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-[10px] text-(--text-secondary) py-2">
                    {WEEK_LABELS.map((label) => (
                      <div key={label} className="text-center">
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-[11px]">
                    {days.map((date) => {
                      const isSelected =
                        (pendingRange.from &&
                          isSameDay(date, pendingRange.from)) ||
                        (pendingRange.to && isSameDay(date, pendingRange.to));
                      const inRange = isInRange(date);
                      const muted = !isSameMonth(date, monthStart);
                      const today = isToday(date);

                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => handleSelect(date)}
                          className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center transition-all
                            ${muted ? "text-(--text-secondary)/50" : "text-(--text-primary)"}
                            ${inRange ? "bg-[color:var(--primary)]/10" : ""}
                            ${isSelected ? "bg-[#0f1b3d] text-white" : "hover:bg-(--hover-bg)"}
                            ${today && !isSelected ? "ring-1 ring-[color:var(--primary)]/40" : ""}
                          `}
                        >
                          {format(date, "d")}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-(--card-border) pt-3 mt-3">
                    <button
                      onClick={() => {
                        setPendingRange(range ?? {});
                        setOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs rounded-xl border border-(--card-border) hover:bg-(--hover-bg) transition"
                    >
                      {isRtl ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      onClick={() => {
                        setRange(pendingRange);
                        setOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs rounded-xl bg-[#0f1b3d] text-white hover:bg-[#162a5a] transition"
                    >
                      {isRtl ? "تطبيق" : "Apply"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
