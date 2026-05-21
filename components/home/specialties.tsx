"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  HeartPulse,
  Bone,
  Baby,
  Brain,
  Ear,
  Eye,
  Stethoscope,
  Droplets,
  Scan,
  Syringe,
  Droplet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { t } from "@/i18n";
import { motion } from "framer-motion";

type Specialty = {
  title: string;
  doctors: number;
  icon: React.ReactNode;
};

const specialties: Specialty[] = [
  { title: "Orthopedics", doctors: 200, icon: <Bone size={24} /> },
  { title: "Neurology", doctors: 100, icon: <Brain size={24} /> },
  { title: "Pediatrics", doctors: 80, icon: <Baby size={24} /> },
  { title: "Cardiology", doctors: 120, icon: <HeartPulse size={24} /> },
  { title: "Pulmonology", doctors: 200, icon: <Stethoscope size={24} /> },
  { title: "Nephrology", doctors: 100, icon: <Droplets size={24} /> },
  { title: "Oncology", doctors: 80, icon: <Scan size={24} /> },
  { title: "ENT", doctors: 120, icon: <Ear size={24} /> },
  { title: "Dermatology", doctors: 100, icon: <Droplet size={24} /> },
  { title: "OB-GYN", doctors: 80, icon: <Syringe size={24} /> },
  { title: "Ophthalmology", doctors: 120, icon: <Eye size={24} /> },
];

const Specialties = () => {
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
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.15 },
        },
      }}
      className="rounded-[30px] border border-[#d8e3ff] bg-white px-4 py-10 sm:px-6 lg:px-8"
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 60 },
          show: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-10 text-center"
      >
        <h2 className="text-2xl font-extrabold text-[#001a6e] sm:text-3xl">
          {t("specialties.title", locale)}
        </h2>
        <p className="mt-2 text-sm text-[#6d7da7]">
          {t("specialties.description", locale)}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
        className="mb-8 flex justify-start"
      >
        <Link
          href="/specialties"
          className="inline-flex items-center gap-2 rounded-full border border-[#d1ddff] px-4 py-2 text-sm font-semibold text-[#001a6e] transition hover:bg-[#f4f7ff]"
        >
          {t("specialties.viewAll", locale)}
          <ChevronLeft size={18} />
        </Link>
      </motion.div>

      <motion.div
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: 0.08 },
          },
        }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {specialties.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              delay: i * 0.05,
            }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="group rounded-2xl border border-[#dbe4ff] bg-[#f9fbff] px-3 py-5 text-center transition hover:-translate-y-1 hover:border-[#9db4ff] hover:shadow-[0_14px_30px_rgba(18,57,173,0.15)]"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7eeff] text-[#1742c7] transition group-hover:bg-[#1c3faa] group-hover:text-white"
            >
              {item.icon}
            </motion.div>

            <h3 className="text-sm font-bold text-[#0f1a4f">{item.title}</h3>

            <p className="mt-1 text-xs text-[#4f66a7]">
              {item.doctors} doctors
            </p>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
};

export default Specialties;