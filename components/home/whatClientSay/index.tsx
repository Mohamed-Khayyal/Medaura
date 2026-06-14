"use client";

import Image from "next/image";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";
import { motion } from "framer-motion";

export default function WhatClientSay() {
  const locale = useLocale();

  const testimonials = t("whatClientSay.testimonials", locale) as any[];

  return (
    <motion.section
      key={locale}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="rounded-[30px] border border-[#d8e3ff] bg-[#f5f8ff] px-4 py-10 sm:px-6 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
        className="mb-10 text-center"
      >
        <h2 className="text-2xl font-extrabold text-[#001a6e] sm:text-3xl">
          {t("whatClientSay.title", locale)}
        </h2>

        <p className="mt-2 text-sm text-[#6b7aa4]">
          {t("whatClientSay.description", locale)}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {testimonials.map((item, i) => (
          <motion.article
            key={item.name}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.7,
              delay: i * 0.12,
              ease: "easeOut",
            }}
            whileHover={{ y: -6 }}
            className="rounded-3xl border border-[#d9e4ff] bg-white p-5 shadow-[0_10px_25px_rgba(20,61,180,0.08)]"
          >
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.3 }}
                className="relative h-12 w-12 overflow-hidden rounded-full border border-[#d6e1ff]"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </motion.div>

              <h3 className="text-sm font-extrabold text-[#14245a]">
                {item.name}
              </h3>
            </div>

            <p className="text-sm leading-7 text-[#566a9c]">
              &quot;{item.text}&quot;
            </p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}