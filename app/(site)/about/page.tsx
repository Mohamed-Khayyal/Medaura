"use client";

import Image from "next/image";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

export default function AboutPage() {
  const locale = useLocale();
  const values = Array.isArray(t("aboutPage.values", locale))
    ? (t("aboutPage.values", locale) as string[])
    : [];

  const isRtl = locale === "ar";

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-white pb-16 pt-28">
      <section className={`mx-auto flex w-full max-w-[1100px] flex-col items-center gap-12 px-4 py-12 ${isRtl ? "md:flex-row-reverse" : "md:flex-row"} md:gap-14 lg:py-20`}>
        <div className="relative w-full flex-1 md:min-h-[420px]">
          <Image
            src="/images/aboutus.png"
            alt={t("aboutPage.imageAlt", locale)}
            width={1290}
            height={872}
            priority
            className="h-auto w-full object-contain"
          />
        </div>

        <div className={`w-full flex-1 text-center ${isRtl ? "md:text-right" : "md:text-left"}`}>
          <p className="mb-3 text-[15px] font-bold text-[#001a6e]">
            {t("aboutPage.subtitle", locale)}
          </p>
          <h1 className="text-[38px] font-extrabold leading-tight text-[#111827] sm:text-[48px]">
            {t("aboutPage.title", locale)}
          </h1>
          <p className="mt-6 text-[18px] font-medium leading-9 text-[#111827]">
            {t("aboutPage.description1", locale)}
          </p>
          <p className="mt-4 text-[18px] font-medium leading-9 text-[#111827]">
            {t("aboutPage.description2", locale)}
          </p>

          <div className={`mt-8 flex flex-wrap justify-center gap-3 ${isRtl ? "md:justify-start" : "md:justify-start"}`}>
            {values.map((value) => (
              <span
                key={value}
                className="rounded-[6px] border border-[#d9e3ff] bg-[#f7f9ff] px-4 py-2 text-sm font-bold text-[#001a6e]"
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
