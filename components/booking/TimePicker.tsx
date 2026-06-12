"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { t } from "@/i18n";

interface TimeSlot {
  from: string;
  to?: string;
  available: boolean;
}

interface TimePickerProps {
  onSelect: (time: string) => void;
  onClose: () => void;
  slots?: TimeSlot[];
  loading?: boolean;
  error?: string;
}

function formatTo12Hour(timeStr?: string): string {
  if (!timeStr) return "";
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes}`;
}

export default function TimePicker({
  onSelect,
  onClose,
  slots = [],
  loading = false,
  error = "",
}: TimePickerProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [locale] = useState(() =>
    typeof window === "undefined"
      ? "en"
      : localStorage.getItem("locale") || "en"
  );

  const handleSelectTime = (slot: TimeSlot) => {
    if (slot.available) {
      setSelectedTime(slot.from);
    }
  };

  const handleConfirm = () => {
    if (selectedTime) {
      onSelect(selectedTime);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-[#001A6E]">
            {t("booking.selectTime", locale)}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-[#001A6E]"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center font-semibold text-[#001A6E]">
            {locale === "en"
              ? "Loading available times..."
              : "جاري تحميل المواعيد..."}
          </p>
        ) : error ? (
          <p className="py-10 text-center font-semibold text-red-600">
            {error}
          </p>
        ) : slots.length === 0 ? (
          <p className="py-10 text-center font-semibold text-gray-500">
            {locale === "en"
              ? "No available times for this date."
              : "لا توجد مواعيد متاحة لهذا اليوم."}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const isSelected = selectedTime === slot.from;
              const from12 = formatTo12Hour(slot.from);
              const to12 = slot.to ? formatTo12Hour(slot.to) : "";
              const label = to12 ? `${from12} - ${to12}` : from12;

              return (
                <button
                  key={`${slot.from}-${slot.to || ""}`}
                  disabled={!slot.available}
                  onClick={() => handleSelectTime(slot)}
                  className={`py-3 px-4 rounded-2xl font-semibold text-sm transition-all
                    ${
                      !slot.available
                        ? "bg-gray-100 text-gray-300 cursor-not-allowed line-through"
                        : isSelected
                          ? "bg-[#001A6E] text-white shadow-lg"
                          : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#001A6E] hover:text-[#001A6E]"
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-gray-200 py-4 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t("booking.cancel", locale)}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedTime}
            className={`flex-1 rounded-2xl py-4 font-bold transition-colors ${
              selectedTime
                ? "bg-[#001A6E] text-white hover:bg-[#001250]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {t("booking.confirm", locale)}
          </button>
        </div>
      </div>
    </div>
  );
}
