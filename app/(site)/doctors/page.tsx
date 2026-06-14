"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Stethoscope,
  UserRound,
  X,
  Star,
  Clock,
  BadgeCheck,
  ArrowUpDown,
  MapPin,
} from "lucide-react";
import type { DoctorProfile } from "@/lib/types/api";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

const API_BASE_URL = "";
const DOCTORS_API_URL = "/api/doctors";
const DOCTOR_FALLBACK_IMAGE = "/images/blank-profile-picture.png";

type DoctorWithClinic = DoctorProfile & {
  clinic_id?: number;
  photo?: string;
  image?: string;
  email?: string;
  average_rating?: number;
  total_ratings?: number;
  gender?: "male" | "female";
  location?: string;
};

type SortKey = "rating" | "price_asc" | "price_desc" | "name";
type GenderFilter = "all" | "male" | "female";

const SPECIALTIES = [
  "جميع التخصصات",
  "مخ واعصاب",
  "عظام",
  "الأورام",
  "طب الأذن والأنف والحنجرة",
  "طب العيون",
  "قلب و اوعية دموية",
  "صدر و جهاز تنفسي",
  "كلى",
  "اسنان",
  "اطفال و حديثي الولادة",
  "جلدية",
  "نسا و توليد",
];

const getSpecialtyLabel = (spec: string, locale: string) => {
  if (locale === "en") {
    const keys: Record<string, string> = {
      "جميع التخصصات": "All Specialties",
      "مخ واعصاب": "Neurology",
      "عظام": "Orthopedics",
      "الأورام": "Oncology",
      "طب الأذن والأنف والحنجرة": "ENT",
      "طب العيون": "Ophthalmology",
      "قلب و اوعية دموية": "Cardiology",
      "صدر و جهاز تنفسي": "Pulmonology",
      "كلى": "Nephrology",
      "اسنان": "Dentistry",
      "اطفال و حديثي الولادة": "Pediatrics",
      "جلدية": "Dermatology",
      "نسا و توليد": "OB-GYN"
    };
    return keys[spec] || spec;
  }
  return spec;
};

const getSortOptions = (locale: string) => {
  if (locale === "en") {
    return [
      { label: "Top Rated", value: "rating" as SortKey },
      { label: "Price: Low to High", value: "price_asc" as SortKey },
      { label: "Price: High to Low", value: "price_desc" as SortKey },
      { label: "Alphabetical (A-Z)", value: "name" as SortKey },
    ];
  }
  return [
    { label: "الأعلى تقييماً", value: "rating" as SortKey },
    { label: "السعر: الأقل أولاً", value: "price_asc" as SortKey },
    { label: "السعر: الأعلى أولاً", value: "price_desc" as SortKey },
    { label: "الاسم أبجدياً", value: "name" as SortKey },
  ];
};

const getPriceRanges = (locale: string) => {
  if (locale === "en") {
    return [
      { label: "All Prices", min: 0, max: Infinity },
      { label: "Under 200 EGP", min: 0, max: 200 },
      { label: "200 – 500 EGP", min: 200, max: 500 },
      { label: "500 – 1000 EGP", min: 500, max: 1000 },
      { label: "Over 1000 EGP", min: 1000, max: Infinity },
    ];
  }
  return [
    { label: "جميع الأسعار", min: 0, max: Infinity },
    { label: "أقل من 200 ج.م", min: 0, max: 200 },
    { label: "200 – 500 ج.م", min: 200, max: 500 },
    { label: "500 – 1000 ج.م", min: 500, max: 1000 },
    { label: "أكثر من 1000 ج.م", min: 1000, max: Infinity },
  ];
};

const tPage = (key: string, locale: string) => {
  const translations: Record<string, { en: string; ar: string }> = {
    badgeText: { en: "Best Certified Doctors in Egypt", ar: "أفضل الأطباء المعتمدين في مصر" },
    mostBooked: { en: "Most Booked Doctors", ar: "الأطباء الأكثر حجزاً" },
    doctorsInSpecialty: { en: "Doctors in {specialty}", ar: "أطباء تخصص {specialty}" },
    availableCountInSpecialty: { en: "{count} available doctors in {specialty}", ar: "{count} طبيب متاح في تخصص {specialty}" },
    certifiedCountAll: { en: "{count} certified doctors in all specialties", ar: "{count} طبيب موثق في جميع التخصصات" },
    searchPlaceholder: { en: "Search by doctor name or specialty...", ar: "ابحث باسم الطبيب أو التخصص..." },
    filterLabelSpecialty: { en: "Select Specialty", ar: "اختر تخصص" },
    filterLabelPrice: { en: "Consultation Price", ar: "سعر الاستشارة" },
    filterLabelGender: { en: "Gender", ar: "النوع" },
    filterLabelSort: { en: "Sort By", ar: "الترتيب" },
    clearFilters: { en: "Clear Filters", ar: "مسح الفلاتر" },
    genderAll: { en: "All", ar: "الكل" },
    genderMale: { en: "Male", ar: "ذكر" },
    genderFemale: { en: "Female", ar: "أنثى" },
    sessionFee: { en: "Session Fee", ar: "سعر الجلسة" },
    workingHours: { en: "Working Hours", ar: "مواعيد العمل" },
    currency: { en: "EGP", ar: "ج.م" },
    viewProfile: { en: "View Profile", ar: "عرض الملف الشخصي" },
    showing: { en: "Showing", ar: "عرض" },
    of: { en: "of", ar: "من" },
    doctors: { en: "doctors", ar: "طبيب" },
    page: { en: "Page", ar: "صفحة" },
    noDoctors: { en: "No doctors available", ar: "لا يوجد أطباء متاحون" },
    changeFilters: { en: "Try changing the filters or search for different terms", ar: "حاول تغيير الفلاتر أو ابحث بكلمات مختلفة" },
    clearAllFilters: { en: "Clear All Filters", ar: "مسح جميع الفلاتر" },
    loading: { en: "Loading...", ar: "جاري التحميل..." },
    failedToLoad: { en: "Failed to load data. Please try again.", ar: "حدث خطأ في تحميل البيانات" }
  };
  return translations[key]?.[locale === "en" ? "en" : "ar"] || key;
};

function getDoctorImage(doctor: DoctorWithClinic) {
  return doctor.photo?.trim() || doctor.image?.trim() || DOCTOR_FALLBACK_IMAGE;
}

async function getDoctors(): Promise<DoctorWithClinic[]> {
  try {
    const response = await fetch(DOCTORS_API_URL);
    const payload = await response.json();
    
    const list = Array.isArray(payload) 
      ? payload 
      : Array.isArray(payload.data)
        ? payload.data
        : payload.data?.doctors || payload.doctors || [];

    return list.map((doctor: any) => ({
      ...doctor,
      id: doctor.id ?? doctor.doctor_id,
    })) as DoctorWithClinic[];
  } catch (err) {
    console.error("Error fetching doctors client side:", err);
    return [];
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating)
              ? "fill-[#f4b740] text-[#f4b740]"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function DoctorCard({ doctor, index, locale }: { doctor: DoctorWithClinic; index: number; locale: string }) {
  const ratingValue = Number(doctor.average_rating ?? doctor.rating ?? 0);
  const rating = Number.isFinite(ratingValue) ? ratingValue : 0;
  const isRtl = locale === "ar";

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,26,110,0.15)]"
      style={{
        boxShadow: "0 4px 24px rgba(0,26,110,0.08)",
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div className="h-1 w-full bg-gradient-to-r from-[#001a6e] to-[#0036d9]" />

      <div className="flex flex-1 flex-col p-5">
        <div className={`flex items-start gap-4 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="relative shrink-0">
            <div className="relative h-[76px] w-[76px] overflow-hidden rounded-xl bg-[#edf2ff] ring-2 ring-[#001a6e]/10">
              <Image
                src={getDoctorImage(doctor)}
                alt={doctor.full_name}
                width={76}
                height={76}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className={`absolute -bottom-2 ${isRtl ? "-right-2" : "-left-2"} flex items-center gap-0.5 rounded-full bg-[#001a6e] px-2 py-0.5 text-[10px] font-bold text-white shadow-lg`}>
              <Star className="h-2.5 w-2.5 fill-[#ffd84d] text-[#ffd84d]" />
              <span>{rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h2 className="line-clamp-1 text-[15px] font-bold text-[#0f1b3d]">
                  {doctor.full_name}
                </h2>
                <div className={`mt-1 flex items-center gap-1.5 ${isRtl ? "justify-end" : "justify-start"}`}>
                  {!isRtl && <Stethoscope className="h-3.5 w-3.5 shrink-0 text-[#001a6e]" />}
                  <span className="text-[12px] font-semibold text-[#001a6e]">
                    {t("doctorCard.consultant", locale)} {getSpecialtyLabel(doctor.specialist || "", locale)}
                  </span>
                  {isRtl && <Stethoscope className="h-3.5 w-3.5 shrink-0 text-[#001a6e]" />}
                </div>
                <div className={`mt-1.5 flex items-center gap-1 ${isRtl ? "justify-end" : "justify-start"}`}>
                  {isRtl ? (
                    <>
                      <StarRating rating={rating} />
                      {doctor.total_ratings != null && (
                        <span className="text-[11px] text-gray-400">
                          ({doctor.total_ratings})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {doctor.total_ratings != null && (
                        <span className="text-[11px] text-gray-400">
                          ({doctor.total_ratings})
                        </span>
                      )}
                      <StarRating rating={rating} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="my-4 h-px bg-gray-100" />

        <div className={`grid grid-cols-2 gap-3 ${isRtl ? "text-right" : "text-left"}`}>
          <div className={`flex flex-col rounded-xl bg-[#f7f9ff] p-3 ${isRtl ? "items-end" : "items-start"}`}>
            <p className="text-[11px] font-medium text-gray-400">{tPage("sessionFee", locale)}</p>
            <p className="mt-1 text-[15px] font-bold text-[#001a6e]">
              {isRtl ? (
                <>
                  {doctor.consultation_price}
                  <span className="text-[11px] font-medium"> {tPage("currency", locale)}</span>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-medium">{tPage("currency", locale)} </span>
                  {doctor.consultation_price}
                </>
              )}
            </p>
          </div>
          <div className={`flex flex-col rounded-xl bg-[#f7f9ff] p-3 ${isRtl ? "items-end" : "items-start"}`}>
            <p className="text-[11px] font-medium text-gray-400">{tPage("workingHours", locale)}</p>
            <div className="mt-1 flex items-center gap-1">
              {!isRtl && <Clock className="h-3 w-3 shrink-0 text-[#001a6e]" />}
              <p className="text-[13px] font-bold text-[#001a6e]">
                {doctor.work_from} – {doctor.work_to}
              </p>
              {isRtl && <Clock className="h-3 w-3 shrink-0 text-[#001a6e]" />}
            </div>
          </div>
        </div>

        {doctor.location && (
          <div className={`mt-3 flex items-center gap-2 rounded-xl bg-[#f8fafc] px-3 py-2 ${isRtl ? "justify-end text-right" : "justify-start text-left"}`}>
            {!isRtl && <MapPin className="h-3.5 w-3.5 shrink-0 text-[#001a6e]" />}
            <span className="text-[12px] font-medium text-[#475569]">{doctor.location}</span>
            {isRtl && <MapPin className="h-3.5 w-3.5 shrink-0 text-[#001a6e]" />}
          </div>
        )}

        <Link
          href={`/doctors/${doctor.id}`}
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#001a6e] to-[#0036d9] text-[13px] font-semibold text-white shadow-md shadow-[#001a6e]/20 transition-all duration-200 hover:shadow-lg hover:shadow-[#001a6e]/30 hover:brightness-110"
        >
          {tPage("viewProfile", locale)}
          <BadgeCheck className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function DropdownFilter<T extends string>({
  label,
  icon,
  options,
  value,
  onChange,
  isRtl,
}: {
  label: string;
  icon: React.ReactNode;
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  isRtl: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all duration-200 ${
          value !== options[0].value
            ? "border-[#001a6e] bg-[#001a6e] text-white shadow-md"
            : "border-[#dbe2f5] bg-white text-[#001a6e] hover:border-[#001a6e] hover:bg-[#f0f4ff]"
        }`}
      >
        {icon}
        <span className="max-w-[110px] truncate">
          {value !== options[0].value ? selected?.label : label}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className={`absolute ${isRtl ? "right-0" : "left-0"} top-[calc(100%+6px)] z-50 min-w-[170px] overflow-hidden rounded-xl border border-[#e6eaf0] bg-white shadow-[0_16px_48px_rgba(0,26,110,0.14)]`}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center ${isRtl ? "justify-end text-right" : "justify-start text-left"} px-4 py-2.5 text-[13px] font-medium transition-colors ${
                value === opt.value
                  ? "bg-[#001a6e] text-white"
                  : "text-[#0f1b3d] hover:bg-[#f0f4ff]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0 4px 24px rgba(0,26,110,0.08)" }}>
      <div className="h-1 bg-gray-200" />
      <div className="p-5">
        <div className="flex gap-4">
          <div className="h-[76px] w-[76px] rounded-xl bg-gray-200" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-3/4 rounded-full bg-gray-200" />
            <div className="h-3 w-1/2 rounded-full bg-gray-200" />
            <div className="h-3 w-1/3 rounded-full bg-gray-200" />
          </div>
        </div>
        <div className="my-4 h-px bg-gray-100" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 rounded-xl bg-gray-100" />
          <div className="h-16 rounded-xl bg-gray-100" />
        </div>
        <div className="mt-4 h-10 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

const PAGE_SIZE = 9;

function DoctorsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSpecialist = searchParams?.get("specialist")?.trim() || "";

  const locale = useLocale();
  const isRtl = locale === "ar";

  const [allDoctors, setAllDoctors] = useState<DoctorWithClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Filter state
  const [specialtyFilter, setSpecialtyFilter] = useState<string>(
    urlSpecialist || "جميع التخصصات"
  );
  const [priceRangeIdx, setPriceRangeIdx] = useState(0);
  const [gender, setGender] = useState<GenderFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [searchInput, setSearchInput] = useState("");

  // Load ALL doctors once on mount — client-side filtering handles everything
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getDoctors();
        setAllDoctors(data);
      } catch (e) {
        setError(tPage("failedToLoad", locale));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [locale]);

  // Sync specialty filter whenever the URL ?specialist param changes
  useEffect(() => {
    if (urlSpecialist) setSpecialtyFilter(urlSpecialist);
    else setSpecialtyFilter("جميع التخصصات");
    setPage(1);
  }, [urlSpecialist]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [specialtyFilter, priceRangeIdx, gender, sortKey, searchInput]);

  // Client-side filtering & sorting
  const filtered = allDoctors
    .filter((d) => {
      if (
        specialtyFilter !== "جميع التخصصات" &&
        d.specialist?.trim() !== specialtyFilter.trim()
      )
        return false;
      const range = getPriceRanges(locale)[priceRangeIdx];
      if (
        d.consultation_price < range.min ||
        d.consultation_price > range.max
      )
        return false;
      if (gender !== "all" && d.gender && d.gender !== gender) return false;
      if (
        searchInput.trim() &&
        !d.full_name.includes(searchInput.trim()) &&
        !d.specialist?.includes(searchInput.trim())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortKey) {
        case "rating": {
          const ra = Number(a.average_rating ?? a.rating ?? 0);
          const rb = Number(b.average_rating ?? b.rating ?? 0);
          return rb - ra;
        }
        case "price_asc":
          return a.consultation_price - b.consultation_price;
        case "price_desc":
          return b.consultation_price - a.consultation_price;
        case "name":
          return a.full_name.localeCompare(b.full_name, locale);
        default:
          return 0;
      }
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters =
    specialtyFilter !== "جميع التخصصات" ||
    priceRangeIdx !== 0 ||
    gender !== "all" ||
    searchInput.trim().length > 0;

  function clearFilters() {
    setSpecialtyFilter("جميع التخصصات");
    setPriceRangeIdx(0);
    setGender("all");
    setSearchInput("");
    setSortKey("rating");
    router.push("/doctors");
  }

  // Pagination pages
  function getPages(): (number | "...")[] {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen pb-20 pt-28" style={{ background: "linear-gradient(160deg, #f5f7ff 0%, #f9fafb 100%)" }}>
      <section className="mx-auto w-full max-w-[1260px] px-4">

        {/* ── Hero header ── */}
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#001a6e]/8 px-4 py-1.5 text-[13px] font-semibold text-[#001a6e] mb-4">
            <Stethoscope className="h-4 w-4" />
            <span>{tPage("badgeText", locale)}</span>
          </div>
          <h1 className="text-[32px] font-bold leading-tight text-[#0f1b3d] sm:text-[44px]">
            {urlSpecialist
              ? tPage("doctorsInSpecialty", locale).replace("{specialty}", getSpecialtyLabel(urlSpecialist, locale))
              : tPage("mostBooked", locale)}
          </h1>
          <p className="mt-2 text-[16px] font-medium text-[#8b93a5]">
            {urlSpecialist
              ? tPage("availableCountInSpecialty", locale)
                  .replace("{count}", String(filtered.length))
                  .replace("{specialty}", getSpecialtyLabel(urlSpecialist, locale))
              : tPage("certifiedCountAll", locale).replace("{count}", String(allDoctors.length))}
          </p>
        </header>

        {/* ── Search bar ── */}
        <div className="mx-auto mt-8 max-w-xl">
          <div className="flex items-center gap-3 rounded-2xl border border-[#dbe2f5] bg-white px-4 py-3 shadow-md shadow-[#001a6e]/05 focus-within:border-[#001a6e] focus-within:shadow-[#001a6e]/10 transition-all duration-200">
            <Search className="h-5 w-5 shrink-0 text-[#8b93a5]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={tPage("searchPlaceholder", locale)}
              className={`flex-1 bg-transparent ${isRtl ? "text-right" : "text-left"} text-[14px] text-[#0f1b3d] placeholder:text-[#8b93a5] outline-none`}
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="text-[#8b93a5] hover:text-[#001a6e]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Filters row ── */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <SlidersHorizontal className="h-4 w-4 text-[#8b93a5]" />

          <DropdownFilter
            label={tPage("filterLabelSpecialty", locale)}
            icon={<Stethoscope className="h-3.5 w-3.5 shrink-0" />}
            options={SPECIALTIES.map((s) => ({ label: getSpecialtyLabel(s, locale), value: s }))}
            value={specialtyFilter}
            onChange={(v) => {
              setSpecialtyFilter(v);
              if (v === "جميع التخصصات") router.push("/doctors");
              else router.push(`/doctors?specialist=${encodeURIComponent(v)}`);
            }}
            isRtl={isRtl}
          />

          <DropdownFilter
            label={tPage("filterLabelPrice", locale)}
            icon={<span className="text-[11px] font-bold">{tPage("currency", locale)}</span>}
            options={getPriceRanges(locale).map((r, i) => ({ label: r.label, value: String(i) as any }))}
            value={String(priceRangeIdx) as any}
            onChange={(v) => setPriceRangeIdx(Number(v))}
            isRtl={isRtl}
          />

          <DropdownFilter
            label={tPage("filterLabelGender", locale)}
            icon={<UserRound className="h-3.5 w-3.5 shrink-0" />}
            options={[
              { label: tPage("genderAll", locale), value: "all" as GenderFilter },
              { label: tPage("genderMale", locale), value: "male" as GenderFilter },
              { label: tPage("genderFemale", locale), value: "female" as GenderFilter },
            ]}
            value={gender}
            onChange={setGender}
            isRtl={isRtl}
          />

          <DropdownFilter
            label={tPage("filterLabelSort", locale)}
            icon={<ArrowUpDown className="h-3.5 w-3.5 shrink-0" />}
            options={getSortOptions(locale)}
            value={sortKey}
            onChange={setSortKey}
            isRtl={isRtl}
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 transition hover:bg-red-100"
            >
              <X className="h-3.5 w-3.5" />
              {tPage("clearFilters", locale)}
            </button>
          )}
        </div>

        {/* ── Results count ── */}
        {!loading && !error && (
          <div className="mt-6 flex items-center justify-between text-[13px] text-[#8b93a5]">
            <span>
              {tPage("showing", locale)}{" "}
              <span className="font-bold text-[#0f1b3d]">
                {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)} –{" "}
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </span>{" "}
              {tPage("of", locale)}{" "}
              <span className="font-bold text-[#0f1b3d]">{filtered.length}</span>{" "}
              {tPage("doctors", locale)}
            </span>
            <span>
              {tPage("page", locale)}{" "}
              <span className="font-bold text-[#0f1b3d]">{page}</span> {tPage("of", locale)}{" "}
              <span className="font-bold text-[#0f1b3d]">{totalPages}</span>
            </span>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Error state ── */}
        {!loading && error && (
          <div className="mt-20 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-[16px] font-semibold text-red-600">{error}</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="mt-20 flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0f4ff]">
              <Stethoscope className="h-10 w-10 text-[#001a6e]/40" />
            </div>
            <p className="text-[18px] font-bold text-[#0f1b3d]">
              {tPage("noDoctors", locale)}
            </p>
            <p className="text-[14px] text-[#8b93a5]">
              {tPage("changeFilters", locale)}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 rounded-xl bg-[#001a6e] px-6 py-2.5 text-[13px] font-semibold text-white hover:opacity-90"
              >
                {tPage("clearAllFilters", locale)}
              </button>
            )}
          </div>
        )}

        {/* ── Doctor cards grid ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((doctor, index) => (
              <DoctorCard key={doctor.id ?? index} doctor={doctor} index={index} locale={locale} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dbe2f5] bg-white text-[#001a6e] shadow-sm transition-all hover:border-[#001a6e] hover:bg-[#f0f4ff] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous Page"
            >
              {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            <div className="flex items-center gap-1.5">
              {getPages().map((item, idx) =>
                item === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-10 w-8 items-center justify-center text-[#8b93a5]"
                  >
                    ···
                  </span>
                ) : (
                  <button
                    key={`page-${item}`}
                    onClick={() => setPage(item as number)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border text-[13px] font-bold transition-all duration-200 ${
                      page === item
                        ? "border-[#001a6e] bg-[#001a6e] text-white shadow-md shadow-[#001a6e]/30"
                        : "border-[#dbe2f5] bg-white text-[#001a6e] hover:border-[#001a6e] hover:bg-[#f0f4ff]"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dbe2f5] bg-white text-[#001a6e] shadow-sm transition-all hover:border-[#001a6e] hover:bg-[#f0f4ff] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next Page"
            >
              {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function DoctorsPage() {
  const [locale, setLocale] = useState("ar");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocale(localStorage.getItem("locale") || "ar");
    }
  }, []);
  const loadingText = locale === "en" ? "Loading..." : "جاري التحميل...";

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f8faff]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#001a6e] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 font-semibold">{loadingText}</p>
        </div>
      </div>
    }>
      <DoctorsPageContent />
    </Suspense>
  );
}
