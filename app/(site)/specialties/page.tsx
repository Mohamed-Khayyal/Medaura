"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Baby,
  Bone,
  Brain ,
  ChevronLeft,
  Droplet,
  Droplets,
  Ear,
  Eye,
  HeartPulse,
  Scan,
  Search,
  Stethoscope,
  Syringe,
} from "lucide-react";

type Specialty = {
  key: string;
  titleAr: string;
  titleEn: string;
  apiLabel: string;
  count: number;
  icon: ReactNode;
};

const specialties: Specialty[] = [
  {
    key: "cardio",
    titleAr: "قلب و اوعية دموية",
    titleEn: "Cardiology",
    apiLabel: "قلب و اوعية دموية",
    count: 120,
    icon: <HeartPulse size={24} />,
  },
  {
    key: "pediatrics",
    titleAr: "اطفال و حديثي الولادة",
    titleEn: "Pediatrics",
    apiLabel: "اطفال و حديثي الولادة",
    count: 80,
    icon: <Baby size={24} />,
  },
  {
    key: "neuro",
    titleAr: "مخ واعصاب",
    titleEn: "Neurology",
    apiLabel: "مخ واعصاب",
    count: 100,
    icon: <Brain size={24} />,
  },
  {
    key: "ortho",
    titleAr: "عظام",
    titleEn: "Orthopedics",
    apiLabel: "عظام",
    count: 200,
    icon: <Bone size={24} />,
  },
  {
    key: "pulmo",
    titleAr: "صدر و جهاز تنفسي",
    titleEn: "Pulmonology",
    apiLabel: "صدر و جهاز تنفسي",
    count: 200,
    icon: <Stethoscope size={24} />,
  },
  {
    key: "nephro",
    titleAr: "كلى",
    titleEn: "Nephrology",
    apiLabel: "كلى",
    count: 100,
    icon: <Droplets size={24} />,
  },
  {
    key: "oncology",
    titleAr: "الأورام",
    titleEn: "Oncology",
    apiLabel: "الأورام",
    count: 80,
    icon: <Scan size={24} />,
  },
  {
    key: "ent",
    titleAr: "طب الأذن والأنف والحنجرة",
    titleEn: "ENT",
    apiLabel: "طب الأذن والأنف والحنجرة",
    count: 120,
    icon: <Ear size={24} />,
  },
  {
    key: "ophtha",
    titleAr: "طب العيون",
    titleEn: "Ophthalmology",
    apiLabel: "طب العيون",
    count: 120,
    icon: <Eye size={24} />,
  },
  {
    key: "obgyn",
    titleAr: "نسا و توليد",
    titleEn: "OB-GYN",
    apiLabel: "نسا و توليد",
    count: 80,
    icon: <Syringe size={24} />,
  },
  {
    key: "derma",
    titleAr: "جلدية",
    titleEn: "Dermatology",
    apiLabel: "جلدية",
    count: 100,
    icon: <Droplet size={24} />,
  },
  {
    key: "dentistry",
    titleAr: "اسنان",
    titleEn: "Dentistry",
    apiLabel: "اسنان",
    count: 90,
    icon: <Stethoscope size={24} />,
  },
];

export default function SpecialtiesPage() {
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("cardio");
  const [locale] = useState("ar");

  const isArabic = locale === "en";
  const heroTitle = isArabic ? "اختر تخصصك لحالتك" : "Choose Your Specialty";
  const heroSubtitle = isArabic
    ? "احجز موعدك مع أفضل الاطباء في غضون دقائق"
    : "Book your appointment with top doctors in minutes";
  const searchPlaceholder = isArabic
    ? "ابحث عن تخصصك، اسم الطبيب، المستشفى..."
    : "Search specialty, doctor name, hospital...";
  const listTitle = isArabic ? "التخصصات الطبية" : "Medical Specialties";
  const viewAll = isArabic ? "عرض الكل" : "View all";
  const doctorsWord = isArabic ? "طبيب" : "doctors";

  const filteredSpecialties = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return specialties;
    return specialties.filter((item) => {
      const title = isArabic ? item.titleAr : item.titleEn;
      return title.toLowerCase().includes(q);
    });
  }, [isArabic, search]);

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="mx-auto min-h-screen w-full max-w-7xl bg-white px-4 pb-12 pt-24 sm:px-6 sm:pt-28 lg:px-8"
    >
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-extrabold text-[#0f1a4f] sm:text-5xl">
          {heroTitle}
        </h1>
        <p className="mt-3 text-xl text-[#8a96b2]">{heroSubtitle}</p>

        <div className="relative mx-auto mt-8 max-w-xl">
          <Search
            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#acb2bf] ${isArabic ? "right-4" : "left-4"}`}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className={`h-11 w-full rounded-full border border-[#dce3f2] bg-white px-11 text-sm text-[#2d3551] shadow-[0_2px_8px_rgba(32,50,92,0.07)] outline-none transition focus:border-[#22459f] ${isArabic ? "text-right" : "text-left"}`}
          />
        </div>
      </div>

      <div className="mt-14 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[#0f1a4f]">{listTitle}</h2>
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1 text-lg font-semibold text-[#22459f] hover:opacity-80"
        >
          {viewAll}
          <ChevronLeft size={18} />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filteredSpecialties.map((item) => {
          const active = item.key === selectedSpecialty;
          return (
            <Link
              key={item.key}
              href={`/doctors?specialist=${encodeURIComponent(item.apiLabel)}`}
              onClick={() => setSelectedSpecialty(item.key)}
              className={`rounded-xl border bg-white px-3 py-4 text-center shadow-[0_4px_10px_rgba(28,52,112,0.06)] transition ${active ? "border-[#9db1e8] bg-[#f2f6ff]" : "border-[#e6ebf5] hover:border-[#b8c7ee]"}`}
            >
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center text-[#22459f]">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-[#0f1a4f]">
                {isArabic ? item.titleAr : item.titleEn}
              </h3>
              <p className="mt-1 text-sm text-[#5a6ea8]">
                {item.count} {doctorsWord}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 rounded-xl border border-[#e6ebf5] bg-[#f8fafc] p-8 text-center">
        <h3 className="text-2xl font-bold text-[#0f1a4f]">
          {isArabic ? "اختر تخصصًا لمشاهدة الأطباء المتاحين" : "Select a specialty to view available doctors"}
        </h3>
        <p className="mt-3 text-[#5a6ea8]">
          {isArabic
            ? "يمكنك الآن اختيار التخصص المناسب والانتقال إلى صفحة الأطباء." 
            : "Now choose a specialty and move to the doctors page."}
        </p>
      </div>
    </section>
  );
}
