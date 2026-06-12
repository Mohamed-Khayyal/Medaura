import { useEffect, useState } from "react";

export function useLocale(defaultLocale = "ar") {
  const [locale, setLocale] = useState(defaultLocale);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("locale");
      if (stored) {
        setLocale(stored);
      }
    } catch (err) {
      console.error("Error reading locale from localStorage", err);
    }

    const handleLocaleChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setLocale(detail || defaultLocale);
    };

    window.addEventListener("localeChange", handleLocaleChange);
    return () => {
      window.removeEventListener("localeChange", handleLocaleChange);
    };
  }, [defaultLocale]);

  return locale;
}
