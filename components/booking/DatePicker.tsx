"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { t } from "@/i18n";

interface DatePickerProps {
  onSelect: (date: string) => void;
  onClose: () => void;
  selectedDate?: string;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DatePicker({
  onSelect,
  onClose,
  selectedDate,
}: DatePickerProps) {
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
  const [locale] = useState(() =>
    typeof window === "undefined"
      ? "en"
      : localStorage.getItem("locale") || "en"
  );

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const monthNames =
    locale === "en"
      ? [
          "يناير",
          "فبراير",
          "مارس",
          "أبريل",
          "مايو",
          "يونيو",
          "يوليو",
          "أغسطس",
          "سبتمبر",
          "أكتوبر",
          "نوفمبر",
          "ديسمبر",
        ]
      : [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

  const dayNames =
    locale === "en"
      ? ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  const totalDays = daysInMonth(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );
  const startDay = firstDayOfMonth(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
  }

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
    const value = toDateInputValue(date);
    const isPast = date < today;
    const isSelected = selectedDate === value;

    days.push(
      <button
        key={value}
        disabled={isPast}
        onClick={() => onSelect(value)}
        className={`relative h-10 w-10 flex items-center justify-center rounded-lg text-sm transition-colors
          ${
            isPast
              ? "text-gray-300 cursor-not-allowed"
              : isSelected
                ? "bg-[#001A6E] text-white"
                : "text-[#001A6E] hover:bg-blue-50"
          }
        `}
      >
        {d}
        {isPast && (
          <div className="absolute w-6 h-[1px] bg-gray-300 rotate-[-45deg]"></div>
        )}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-gray-400 hover:text-[#001A6E]"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-xl font-bold text-[#001A6E]">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 text-gray-400 hover:text-[#001A6E]"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center">
          {dayNames.map((day) => (
            <div key={day} className="h-10 text-xs font-medium text-gray-400">
              {day}
            </div>
          ))}
          {days}
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full rounded-2xl bg-[#001A6E] py-4 font-bold text-white hover:bg-[#001250]"
        >
          {t("booking.confirm", locale)}
        </button>
      </div>
    </div>
  );
}
