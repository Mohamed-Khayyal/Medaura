"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Baby,
  Bone,
  Brain,
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
  X,
} from "lucide-react";

const API_BASE = "/api";

// ── Specialty definitions (match DB CHECK constraint exactly) ──────────────
type SpecialtyDef = {
  key: string;
  titleAr: string;
  titleEn: string;
  /** Exact value stored in DB — used for API query param */
  apiLabel: string;
  icon: ReactNode;
  gradient: string; // tailwind gradient classes for card accent
};

const SPECIALTY_DEFS: SpecialtyDef[] = [
  {
    key: "cardio",
    titleAr: "قلب و اوعية دموية",
    titleEn: "Cardiology",
    apiLabel: "قلب و اوعية دموية",
    icon: <HeartPulse size={26} />,
    gradient: "from-rose-500 to-pink-600",
  },
  {
    key: "neuro",
    titleAr: "مخ واعصاب",
    titleEn: "Neurology",
    apiLabel: "مخ واعصاب",
    icon: <Brain size={26} />,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    key: "ortho",
    titleAr: "عظام",
    titleEn: "Orthopedics",
    apiLabel: "عظام",
    icon: <Bone size={26} />,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    key: "pulmo",
    titleAr: "صدر و جهاز تنفسي",
    titleEn: "Pulmonology",
    apiLabel: "صدر و جهاز تنفسي",
    icon: <Stethoscope size={26} />,
    gradient: "from-sky-500 to-blue-600",
  },
  {
    key: "nephro",
    titleAr: "كلى",
    titleEn: "Nephrology",
    apiLabel: "كلى",
    icon: <Droplets size={26} />,
    gradient: "from-cyan-500 to-teal-600",
  },
  {
    key: "oncology",
    titleAr: "الأورام",
    titleEn: "Oncology",
    apiLabel: "الأورام",
    icon: <Scan size={26} />,
    gradient: "from-red-500 to-rose-700",
  },
  {
    key: "ent",
    titleAr: "طب الأذن والأنف والحنجرة",
    titleEn: "ENT",
    apiLabel: "طب الأذن والأنف والحنجرة",
    icon: <Ear size={26} />,
    gradient: "from-emerald-500 to-green-600",
  },
  {
    key: "ophtha",
    titleAr: "طب العيون",
    titleEn: "Ophthalmology",
    apiLabel: "طب العيون",
    icon: <Eye size={26} />,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    key: "obgyn",
    titleAr: "نسا و توليد",
    titleEn: "OB-GYN",
    apiLabel: "نسا و توليد",
    icon: <Syringe size={26} />,
    gradient: "from-fuchsia-500 to-pink-700",
  },
  {
    key: "derma",
    titleAr: "جلدية",
    titleEn: "Dermatology",
    apiLabel: "جلدية",
    icon: <Droplet size={26} />,
    gradient: "from-lime-500 to-green-600",
  },
  {
    key: "dentistry",
    titleAr: "اسنان",
    titleEn: "Dentistry",
    apiLabel: "اسنان",
    icon: <Stethoscope size={26} />,
    gradient: "from-indigo-500 to-blue-700",
  },
  {
    key: "pediatrics",
    titleAr: "اطفال و حديثي الولادة",
    titleEn: "Pediatrics",
    apiLabel: "اطفال و حديثي الولادة",
    icon: <Baby size={26} />,
    gradient: "from-yellow-400 to-amber-500",
  },
];

type SpecialtyWithCount = SpecialtyDef & { count: number };

// ── Fetch doctor count for one specialty ─────────────────────────────────────
async function fetchCountForSpecialty(apiLabel: string): Promise<number> {
  try {
    const res = await fetch(
      `${API_BASE}/doctors?specialist=${encodeURIComponent(apiLabel)}`
    );
    if (!res.ok) return 0;
    const data = await res.json();
    // API returns { results: N, doctors: [...] } — prefer the results field
    if (typeof data.results === "number") return data.results;
    if (typeof data.count === "number") return data.count;
    const doctors: unknown[] = data.doctors ?? data.data ?? [];
    return Array.isArray(doctors) ? doctors.length : 0;
  } catch {
    return 0;
  }
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-[#e6ebf5] bg-white shadow-sm">
      <div className="h-1.5 w-full bg-gray-200" />
      <div className="flex flex-col items-center gap-3 p-5">
        <div className="h-14 w-14 rounded-full bg-gray-200" />
        <div className="h-4 w-2/3 rounded-full bg-gray-200" />
        <div className="h-3 w-1/3 rounded-full bg-gray-100" />
        <div className="mt-2 h-9 w-full rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SpecialtiesPage() {
  const [search, setSearch] = useState("");
  const [specialties, setSpecialties] = useState<SpecialtyWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all counts in parallel
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        SPECIALTY_DEFS.map(async (def) => {
          const count = await fetchCountForSpecialty(def.apiLabel);
          return { ...def, count };
        })
      );
      setSpecialties(results);
    } catch {
      setError("فشل في تحميل التخصصات. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Re-fetch when the user navigates BACK to this page (Page Visibility API)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        loadData();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return specialties;
    const lower = q.toLowerCase();
    return specialties.filter(
      (s) =>
        s.titleAr.includes(q) ||
        s.titleEn.toLowerCase().includes(lower)
    );
  }, [search, specialties]);

  const totalDoctors = specialties.reduce((sum, s) => sum + s.count, 0);

  return (
    <main
      dir="rtl"
      className="min-h-screen pb-20 pt-28"
      style={{ background: "linear-gradient(160deg,#f5f7ff 0%,#f9fafb 100%)" }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ── Hero ── */}
        <header className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#001a6e]/8 px-4 py-1.5 text-[13px] font-semibold text-[#001a6e]">
            <Stethoscope className="h-4 w-4" />
            <span>جميع التخصصات الطبية</span>
          </div>
          <h1 className="text-[32px] font-extrabold leading-tight text-[#0f1a4f] sm:text-[44px]">
            اختر التخصص المناسب
          </h1>
          <p className="mt-2 text-[17px] font-medium text-[#8a96b2]">
            احجز موعدك مع أفضل الأطباء في غضون دقائق
          </p>

          {/* Stats */}
          {!loading && !error && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-[14px] font-semibold text-[#5a6ea8]">
              <span>
                <span className="text-[20px] font-extrabold text-[#0f1a4f]">
                  {SPECIALTY_DEFS.length}
                </span>{" "}
                تخصص طبي
              </span>
              <span className="text-[#d0d8f0]">•</span>
              <span>
                <span className="text-[20px] font-extrabold text-[#0f1a4f]">
                  {totalDoctors}+
                </span>{" "}
                طبيب متاح
              </span>
            </div>
          )}
        </header>

        {/* ── Search ── */}
        <div className="mx-auto mt-8 max-w-xl">
          <div className="flex items-center gap-3 rounded-2xl border border-[#dbe2f5] bg-white px-4 py-3 shadow-md shadow-[#001a6e]/05 transition-all duration-200 focus-within:border-[#001a6e] focus-within:shadow-[#001a6e]/10">
            <Search className="h-5 w-5 shrink-0 text-[#8b93a5]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن تخصص..."
              className="flex-1 bg-transparent text-right text-[14px] text-[#0f1b3d] placeholder:text-[#8b93a5] outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-[#8b93a5] transition hover:text-[#001a6e]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Section title ── */}
        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-[22px] font-bold text-[#0f1a4f]">
            {search.trim()
              ? `نتائج البحث (${filtered.length})`
              : "التخصصات الطبية"}
          </h2>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#22459f] transition hover:opacity-75"
          >
            عرض كل الأطباء
            <ChevronLeft size={16} />
          </Link>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-red-50 py-12 text-center">
            <p className="text-[16px] font-semibold text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-red-600 px-5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* ── Skeleton grid ── */}
        {loading && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Empty search result ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0f4ff]">
              <Search className="h-9 w-9 text-[#001a6e]/30" />
            </div>
            <p className="text-[17px] font-bold text-[#0f1b3d]">
              لا توجد نتائج لـ "{search}"
            </p>
            <p className="text-[13px] text-gray-400">
              جرب كلمة بحث مختلفة
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-1 rounded-xl bg-[#001a6e] px-5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
            >
              مسح البحث
            </button>
          </div>
        )}

        {/* ── Specialty cards grid ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item, idx) => (
              <SpecialtyCard key={item.key} item={item} idx={idx} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ── Specialty Card ─────────────────────────────────────────────────────────────
function SpecialtyCard({
  item,
  idx,
}: {
  item: SpecialtyWithCount;
  idx: number;
}) {
  return (
    <Link
      href={`/doctors?specialist=${encodeURIComponent(item.apiLabel)}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#e6ebf5] bg-white shadow-[0_4px_16px_rgba(28,52,112,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(28,52,112,0.14)]"
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      {/* Gradient top accent bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${item.gradient}`} />

      <div className="flex flex-1 flex-col items-center px-4 pb-4 pt-5 text-center">
        {/* Icon circle */}
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
        >
          {item.icon}
        </div>

        {/* Title */}
        <h3 className="mt-3 text-[14px] font-bold leading-5 text-[#0f1a4f]">
          {item.titleAr}
        </h3>
        <p className="mt-0.5 text-[11px] font-medium text-[#8a96b2]">
          {item.titleEn}
        </p>

        {/* Doctor count badge */}
        <div className="mt-3 flex items-center gap-1.5 rounded-full bg-[#f0f4ff] px-3 py-1 text-[12px] font-bold text-[#22459f]">
          <span>{item.count}</span>
          <span className="font-medium text-[#5a6ea8]">طبيب</span>
        </div>

        {/* CTA */}
        <div
          className={`mt-3 w-full rounded-xl bg-gradient-to-r ${item.gradient} py-2 text-[12px] font-semibold text-white opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100`}
        >
          عرض الأطباء
        </div>
      </div>
    </Link>
  );
}
