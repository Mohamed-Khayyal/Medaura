"use client";

import { CalendarCheck2, Search, UserRoundCheck } from "lucide-react";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";
import { motion } from "framer-motion";

export default function HowItWorks() {
  const locale = useLocale();

  const steps = t("howItWorks.steps", locale) as any[];
  const icons = [Search, UserRoundCheck, CalendarCheck2];

  return (
    <motion.section
      key={locale}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="rounded-[30px] border border-[#d8e3ff] bg-[#f7f9ff] px-4 py-10 sm:px-6 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="mb-10 text-center"
      >
        <h2 className="text-2xl font-extrabold text-[#001a6e] sm:text-3xl">
          {t("howItWorks.title", locale)}
        </h2>

        <p className="mt-2 text-sm text-[#687aa8]">
          {t("howItWorks.description", locale)}
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
        className="grid grid-cols-1 gap-5 md:grid-cols-3"
      >
        {steps.map((step, index) => {
          const Icon = icons[index] || Search;

          return (
            <motion.article
              key={index}
              variants={{
                hidden: { opacity: 0, y: 50 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              whileHover={{ y: -6 }}
              className="rounded-3xl border border-[#d8e2ff] bg-white p-6 shadow-[0_10px_28px_rgba(20,61,180,0.08)]"
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#5e7de0]">
                {t("howItWorks.stepLabel", locale)} {index + 1}
              </p>

              <motion.span
                whileHover={{ scale: 1.08, rotate: 2 }}
                transition={{ duration: 0.4 }}
                className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5edff] text-[#1946cc]"
              >
                <Icon className="h-6 w-6" />
              </motion.span>

              <h3 className="text-lg font-extrabold text-[#102155]">
                {step.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#5d719f]">
                {step.description}
              </p>
            </motion.article>
          );
        })}
      </motion.div>
    </motion.section>
  );
}