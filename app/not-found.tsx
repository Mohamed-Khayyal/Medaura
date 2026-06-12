"use client";

import Link from "next/link";
import { Stethoscope, ArrowLeft, ArrowRight } from "lucide-react";
import { t } from "@/i18n";
import { useLocale } from "@/lib/hooks";
import { motion } from "framer-motion";

export default function NotFound() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full rounded-3xl border border-[#d6e0ff] bg-white/80 p-8 shadow-[0_20px_50px_rgba(28,63,170,0.08)] backdrop-blur-md"
      >
        {/* Animated Icon Circle */}
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#f0f4ff] text-[#1c3faa]">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-[#1c3faa]/10"
          />
          <Stethoscope className="h-12 w-12" />
        </div>

        <h1 className="mt-8 text-7xl font-extrabold tracking-tight text-[#0f1a4f]">
          404
        </h1>
        
        <h2 className="mt-4 text-2xl font-bold text-[#0f1a4f]">
          {t("notFound.title", locale)}
        </h2>
        
        <p className="mt-3 text-sm text-[#5c6f9f] leading-relaxed">
          {t("notFound.description", locale)}
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#1c3faa] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1c3faa]/20 transition hover:bg-[#162f80] hover:shadow-xl hover:shadow-[#162f80]/30 active:scale-95"
          >
            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{t("notFound.backHome", locale)}</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
