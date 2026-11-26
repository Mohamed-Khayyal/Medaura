import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a 24-hour time string ("HH:mm" or "HH:mm:ss") into 12-hour format (1-12)
 * with localized AM/PM ("AM"/"PM" for English, "ص"/"م" for Arabic).
 */
export function formatTime12Hour(
  timeStr?: string | null,
  locale: string = "en",
  includePeriod: boolean = true
): string {
  if (!timeStr) return "";
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return timeStr;

  const hours24 = parseInt(match[1], 10);
  const minutes = match[2];
  if (isNaN(hours24) || hours24 < 0 || hours24 > 23) return timeStr;

  const isPm = hours24 >= 12;
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;

  if (!includePeriod) {
    return `${hours12}:${minutes}`;
  }

  const period =
    locale === "ar" ? (isPm ? "م" : "ص") : isPm ? "PM" : "AM";
  return `${hours12}:${minutes} ${period}`;
}

/**
 * Convert any 24-hour "HH:mm" timestamps inside a notification message to 12-hour format (1-12).
 */
export function formatNotificationMessage(
  message?: string | null,
  locale: string = "ar"
): string {
  if (!message) return "";
  return message.replace(/\b(\d{1,2}:\d{2})(?!\s*(?:ص|م|AM|PM|am|pm))/g, (match) =>
    formatTime12Hour(match, locale)
  );
}
