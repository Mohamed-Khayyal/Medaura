"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { t } from "@/i18n";

const quickLinks = [
  { key: "nav.home", href: "/" },
  { key: "nav.specialties", href: "/site/specialties" },
  { key: "nav.doctors", href: "/doctors" },
  { key: "nav.clinics", href: "/clinics" },
];

export default function Footer() {
  const [locale, setLocale] = useState("ar");

  useEffect(() => {
    function onLocale(e: any) {
      setLocale(e?.detail || "ar");
    }
    window.addEventListener("localeChange", onLocale as EventListener);
    return () =>
      window.removeEventListener("localeChange", onLocale as EventListener);
  }, []);

  return (
    <footer className="bg-[#071022] px-6 py-8 text-white">
      <div
        className={`max-w-7xl mx-auto grid gap-8 sm:grid-cols-2 md:grid-cols-6 items-start lg:gap-6 ${
          locale === "en" ? "text-right" : "text-left"
        }`}
      >
        {/* Brand / description */}
        <div className="md:col-span-2">
          <h3 className="text-2xl font-extrabold text-white">
            {t("footer.title", locale)}
          </h3>
          <p className="mt-3 text-sm text-[#9fb0d6] max-w-[320px]">
            {t("footer.description", locale)}
          </p>
          <div className="mt-6 flex items-center space-x-3 justify-start md:justify-start">
            <a
              href="#"
              aria-label="linkedin"
              className="text-[#9fb0d6] hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8.5h5V24H0V8.5zM8 8.5h4.8v2.1h.1c.7-1.3 2.4-2.7 4.9-2.7 5.2 0 6.2 3.4 6.2 7.8V24h-5v-7.6c0-1.8 0-4.1-2.5-4.1-2.5 0-2.9 2-2.9 4v7.7H8V8.5z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="instagram"
              className="text-[#9fb0d6] hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.3 2.4.5.6.2 1 .5 1.5 1 .5.5.8 1 1 1.5.2.5.4 1.2.5 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.9-.5 2.4-.2.6-.5 1-1 1.5-.5.5-1 .8-1.5 1-.5.2-1.2.4-2.4.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.3-2.4-.5-.6-.2-1-.5-1.5-1-.5-.5-.8-1-1-1.5-.2-.5-.4-1.2-.5-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.9.5-2.4.2-.6.5-1 1-1.5.5-.5 1-.8 1.5-1 .5-.2 1.2-.4 2.4-.5C8.4 2.2 8.8 2.2 12 2.2zm0 3.1c-3 .001-3.3 0-4.5.1-1 .1-1.6.3-2 .5-.5.2-.9.5-1.3.9-.4.4-.7.8-.9 1.3-.2.4-.4 1-.5 2-.1 1.2-.1 1.5-.1 4.5s0 3.3.1 4.5c.1 1 .3 1.6.5 2 .2.5.5.9.9 1.3.4.4.8.7 1.3.9.4.2 1 .4 2 .5 1.2.1 1.5.1 4.5.1s3.3 0 4.5-.1c1-.1 1.6-.3 2-.5.5-.2.9-.5 1.3-.9.4-.4.7-.8.9-1.3.2-.4.4-1 .5-2 .1-1.2.1-1.5.1-4.5s0-3.3-.1-4.5c-.1-1-.3-1.6-.5-2-.2-.5-.5-.9-.9-1.3-.4-.4-.8-.7-1.3-.9-.4-.2-1-.4-2-.5-1.2-.1-1.5-.1-4.5-.1zM12 7.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 2.1a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zm5.2-3.6a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="twitter"
              className="text-[#9fb0d6] hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22 5.9c-.6.3-1.2.5-1.9.6.7-.4 1.2-1 1.5-1.7-.7.4-1.5.7-2.3.9C18.2 5 17.3 4.6 16.3 4.6c-1.8 0-3.2 1.5-3.2 3.2 0 .2 0 .4.1.6-2.7-.1-5.1-1.4-6.7-3.3-.3.5-.4 1-.4 1.6 0 1.2.6 2.2 1.5 2.8-.5 0-1-.2-1.5-.4v.1c0 1.6 1.1 2.9 2.6 3.2-.3.1-.7.1-1 .1-.2 0-.4 0-.6-.1.4 1.2 1.6 2 3 2-1.1.9-2.5 1.4-4.1 1.4H4c1.5.9 3.3 1.4 5.2 1.4 6.2 0 9.6-5.2 9.6-9.7v-.4c.7-.5 1.2-1.1 1.6-1.8-.6.3-1.3.6-2 .7z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Links columns */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#9fb0d6]">
            {t("footer.searchBy", locale)}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-[#b7c9e6]">
            <li>
              <Link href="/" className="hover:text-white">
                {t("nav.home", locale)}
              </Link>
            </li>
            <li>
              <Link href="/site/specialties" className="hover:text-white">
                {t("nav.specialties", locale)}
              </Link>
            </li>
            <li>
              <Link href="/doctors" className="hover:text-white">
                {t("nav.doctors", locale)}
              </Link>
            </li>
            <li>
              <Link href="/appointments" className="hover:text-white">
                {t("footer.myAppointments", locale)}
              </Link>
            </li>
            <li>
              <Link href="/offers" className="hover:text-white">
                {t("footer.offers", locale)}
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">
                {t("footer.aboutUs", locale)}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#9fb0d6]">
            {t("footer.support", locale)}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-[#b7c9e6]">
            <li>
              <Link href="/help" className="hover:text-white">
                {t("footer.helpCenter", locale)}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                {t("footer.contactUs", locale)}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">
                {t("footer.privacy", locale)}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                {t("footer.terms", locale)}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#9fb0d6]">
            {t("footer.team", locale)}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-[#b7c9e6]">
            <li>
              <Link href="/careers" className="hover:text-white">
                {t("footer.joinTeam", locale)}
              </Link>
            </li>
            <li>
              <Link href="/careers/app" className="hover:text-white">
                {t("footer.teamApp", locale)}
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-white">
                {t("footer.teamHelp", locale)}
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact column */}
        <div className="md:col-span-2 lg:col-span-1">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#9fb0d6]">
            {t("footer.contact", locale)}
          </h4>
          <div className="mt-3 space-y-3 text-sm text-[#b7c9e6]">
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-[#9fb0d6]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 19.5v-15zM4.5 4C3.7 4 3 4.7 3 5.5v.5l9 4.5 9-4.5V5.5c0-.8-.7-1.5-1.5-1.5h-15zM21 8.1l-8 4-8-4V19.5c0 .3.2.5.5.5h15c.3 0 .5-.2.5-.5V8.1z" />
              </svg>
              <span>{t("footer.email", locale) || "support@medaura.com"}</span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-[#9fb0d6]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6.6 10.2a15.05 15.05 0 0 0 7.3 7.3l2.2-2.2a1 1 0 0 1 1-.2c1.1.4 2.3.6 3.5.6a1 1 0 0 1 1 1v3.2a1 1 0 0 1-1 1C10.3 21.1 2.9 13.7 2.9 3.9A1 1 0 0 1 3.9 3h3.2a1 1 0 0 1 1 1c0 1.2.2 2.4.6 3.5.2.4 0 .9-.3 1.1l-2.1 2.6z" />
              </svg>
              <span>{t("footer.phone", locale) || "(20)121-859-0546"}</span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-[#9fb0d6]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm6.3 3.3a1 1 0 0 1 1.4 0l1.4 1.4a1 1 0 0 1 0 1.4l-1.4 1.4a1 1 0 0 1-1.4-1.4L18.3 6.7a1 1 0 0 1 0-1.4zM12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" />
              </svg>
              <span>
                {t("footer.supportHours", locale) ||
                  t("footer.supportHoursDefault", locale) ||
                  "الدعم على مدار الساعة طوال أيام الأسبوع"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-[#0f2440] pt-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-[#8fa7d8]">
          <div className="order-2 sm:order-1 mt-3 sm:mt-0">
            {t("footer.copyright", locale)}
          </div>
          <div className="order-1 sm:order-2">&nbsp;</div>
        </div>
      </div>
    </footer>
  );
}
