export type SupportedLocale = "ar" | "en";

export const DUPLICATE_EMAIL_MESSAGES: Record<SupportedLocale, string> = {
  en: "This email is already registered.",
  ar: "هذا البريد الإلكتروني مستخدم بالفعل.",
};

function normalizeLocale(locale?: string | null): SupportedLocale {
  return locale === "en" ? "en" : "ar";
}

export function getClientLocale(defaultLocale: SupportedLocale = "ar") {
  if (typeof window === "undefined") return defaultLocale;

  const storedLocale = window.localStorage.getItem("locale");
  if (storedLocale === "ar" || storedLocale === "en") return storedLocale;

  const documentLocale = window.document.documentElement.lang;
  return documentLocale?.toLowerCase().startsWith("en") ? "en" : defaultLocale;
}

export function getDuplicateEmailValidationMessage(locale?: string | null) {
  return DUPLICATE_EMAIL_MESSAGES[
    normalizeLocale(locale ?? getClientLocale())
  ];
}

export function extractErrorMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;

  if (value && typeof value === "object") {
    const record = value as {
      message?: unknown;
      error?: unknown;
      data?: unknown;
    };

    return (
      extractErrorMessage(record.message) ||
      extractErrorMessage(record.error) ||
      extractErrorMessage(record.data)
    );
  }

  return null;
}

export function getApiErrorStatus(error: unknown): number | null {
  if (error && typeof error === "object") {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : null;
  }

  return null;
}

export function getApiErrorMessage(error: unknown): string | null {
  if (error && typeof error === "object") {
    const dataMessage = extractErrorMessage(
      (error as { data?: unknown }).data
    );
    if (dataMessage) return dataMessage;
  }

  return extractErrorMessage(error);
}

export function isDuplicateEmailError(
  error: unknown,
  message: string | null = getApiErrorMessage(error)
) {
  if (getApiErrorStatus(error) === 409) return true;
  if (!message) return false;

  const normalized = message.toLowerCase();
  const isEnglishDuplicate =
    normalized.includes("email") &&
    (normalized.includes("already") ||
      normalized.includes("duplicate") ||
      normalized.includes("in use") ||
      normalized.includes("registered"));
  const isArabicDuplicate =
    normalized.includes("البريد") &&
    (normalized.includes("مستخدم") || normalized.includes("مسجل"));

  return isEnglishDuplicate || isArabicDuplicate;
}
