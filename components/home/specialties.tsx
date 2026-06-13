"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
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
  Smile,
} from "lucide-react";
import { t } from "@/i18n";
import { motion } from "framer-motion";
import { useLocale } from "@/lib/hooks";

type SpecialtyCatalogItem = {
  title: string;
  Icon: React.ComponentType<{ className?: string }>; 
};

type Specialty = SpecialtyCatalogItem & {
  doctors: number;
};

type DoctorApiItem = {
  specialist?: string | null;
  specialty?: string | null;
};

const SPECIALTIES_API_URL = "/api/doctors/list";

const SPECIALTY_TRANSLATION_KEYS: Record<string, string> = {
  "مخ واعصاب": "authPage.doctor.specialties.neurology",
  "عظام": "authPage.doctor.specialties.orthopedics",
  "الأورام": "authPage.doctor.specialties.oncology",
  "طب الأذن والأنف والحنجرة": "authPage.doctor.specialties.ent",
  "طب العيون": "authPage.doctor.specialties.ophthalmology",
  "قلب و اوعية دموية": "authPage.doctor.specialties.cardiology",
  "صدر و جهاز تنفسي": "authPage.doctor.specialties.pulmonology",
  "كلى": "authPage.doctor.specialties.nephrology",
  "اسنان": "authPage.doctor.specialties.dentistry",
  "اطفال و حديثي الولادة": "authPage.doctor.specialties.pediatrics",
  "جلدية": "authPage.doctor.specialties.dermatology",
  "نسا و توليد": "authPage.doctor.specialties.gynecology",
};

const SPECIALTY_CATALOG: SpecialtyCatalogItem[] = [
  { title: "مخ واعصاب", Icon: Brain },
  { title: "عظام", Icon: Bone },
  { title: "الأورام", Icon: Scan },
  { title: "طب الأذن والأنف والحنجرة", Icon: Ear },
  { title: "طب العيون", Icon: Eye },
  { title: "قلب و اوعية دموية", Icon: HeartPulse },
  { title: "صدر و جهاز تنفسي", Icon: Stethoscope },
  { title: "كلى", Icon: Droplets },
  { title: "اسنان", Icon: Smile },
  { title: "اطفال و حديثي الولادة", Icon: Baby },
  { title: "جلدية", Icon: Droplet },
  { title: "نسا و توليد", Icon: Syringe },
];

const SPECIALTY_ALIASES: Record<string, string> = {
  Neurology: "مخ واعصاب",
  Orthopedics: "عظام",
  Oncology: "الأورام",
  ENT: "طب الأذن والأنف والحنجرة",
  "Ear, Nose, and Throat": "طب الأذن والأنف والحنجرة",
  Ophthalmology: "طب العيون",
  Cardiology: "قلب و اوعية دموية",
  Pulmonology: "صدر و جهاز تنفسي",
  Nephrology: "كلى",
  Dentistry: "اسنان",
  Dental: "اسنان",
  Pediatrics: "اطفال و حديثي الولادة",
  Dermatology: "جلدية",
  "OB-GYN": "نسا و توليد",
  "Obstetrics and Gynecology": "نسا و توليد",
};

const SPECIALTY_TITLE_SET = new Set(
  SPECIALTY_CATALOG.map((item) => item.title)
);

function normalizeSpecialtyName(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();

  if (SPECIALTY_TITLE_SET.has(trimmed)) {
    return trimmed;
  }

  return SPECIALTY_ALIASES[trimmed] || trimmed;
}

function getDoctorsFromPayload(payload: unknown): DoctorApiItem[] {
  if (Array.isArray(payload)) {
    return payload as DoctorApiItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as {
    doctors?: DoctorApiItem[];
    data?: { doctors?: DoctorApiItem[] } | DoctorApiItem[];
  };

  if (Array.isArray(data.doctors)) {
    return data.doctors;
  }

  if (Array.isArray(data.data)) {
    return data.data as DoctorApiItem[];
  }

  if (data.data && Array.isArray(data.data.doctors)) {
    return data.data.doctors;
  }

  return [];
}

const Specialties = () => {
  const locale = useLocale();
  const [specialtyCounts, setSpecialtyCounts] = useState<
    Record<string, number>
  >({});
  const iconClassName = "h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8";

  useEffect(() => {
    const controller = new AbortController();

    async function fetchSpecialties() {
      try {
        const response = await fetch(SPECIALTIES_API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch specialties");
        }

        const payload = await response.json();
        const doctors = getDoctorsFromPayload(payload);
        const counts: Record<string, number> = {};

        for (const doctor of doctors) {
          const name = normalizeSpecialtyName(
            doctor.specialist ?? doctor.specialty
          );

          if (!SPECIALTY_TITLE_SET.has(name)) {
            continue;
          }

          counts[name] = (counts[name] ?? 0) + 1;
        }

        setSpecialtyCounts(counts);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Specialties fetch error:", error);
        setSpecialtyCounts({});
      }
    }

    fetchSpecialties();

    return () => controller.abort();
  }, []);

  const specialties = SPECIALTY_CATALOG.map((item) => ({
    ...item,
    doctors: specialtyCounts[item.title] ?? 0,
  }));

  return (
    <motion.section
      key={locale}
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
          {locale === "ar" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
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
        {specialties.map((item, i) => {
          const Icon = item.Icon;

          return (
            <Link
              key={item.title}
              href={{ pathname: "/doctors", query: { specialist: item.title } }}
              className="block"
            >
              <motion.div
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
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7eeff] text-[#1742c7] transition group-hover:bg-[#1c3faa] group-hover:text-white sm:h-14 sm:w-14 lg:h-16 lg:w-16"
                >
                  <Icon className={iconClassName} />
                </motion.div>

                <h3 className="text-sm font-bold text-[#0f1a4f]">
                  {t(SPECIALTY_TRANSLATION_KEYS[item.title] || item.title, locale)}
                </h3>

                <p className="mt-1 text-xs text-[#4f66a7]">
                  {item.doctors} {t("specialties.doctors", locale)}
                </p>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>
    </motion.section>
  );
};

export default Specialties;