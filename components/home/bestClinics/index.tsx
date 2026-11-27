"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, ChevronLeft, ChevronRight, MapPin, Phone, Star, BadgeCheck, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { t } from "@/i18n";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { useLocale } from "@/lib/hooks";

const BEST_CLINICS_API_URL = "/api/clinic/best?limit=5";
const CLINIC_FALLBACK_IMAGES = [
  "/images/clinic1.png",
  "/images/clinic2.png",
  "/images/clinic3.png",
];

type BestClinicApiItem = {
  clinic_id?: string | number;
  name?: string;
  location?: string;
  phone?: string | null;
  average_rating?: number;
  total_ratings?: number;
  total_bookings?: number;
  photo?: string | null;
};

type BestClinic = {
  id: string | number;
  name: string;
  location: string;
  phone?: string | null;
  rating: number;
  totalRatings: number;
  imageSrc?: string;
};

function mapBestClinic(clinic: BestClinicApiItem): BestClinic {
  return {
    id: clinic.clinic_id !== undefined && clinic.clinic_id !== null ? String(clinic.clinic_id) : "",
    name: clinic.name || "",
    location: clinic.location || "",
    phone: clinic.phone || null,
    rating: Number(clinic.average_rating ?? 0),
    totalRatings: Number(clinic.total_ratings ?? 0),
    imageSrc: clinic.photo?.trim() || undefined,
  };
}
function getClinicProfileHref(clinic: BestClinic) {
  return `/clinics/${clinic.id}`;
}

export default function BestClinics() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [bestClinicsData, setBestClinicData] = useState<BestClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchBestClinics() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(BEST_CLINICS_API_URL, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch best Clinics");
        }

        const data = (await response.json()) as {
          clinics?: BestClinicApiItem[];
        };

        setBestClinicData(
          (data.clinics || []).slice(0, 5).map(mapBestClinic)
        );
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Best clinics fetch error:", error);
        setError("Failed to load best clinics");
      } finally {
        setLoading(false);
      }
    }

    fetchBestClinics();

    return () => controller.abort();
  }, [locale]);

  return (
    <section
      key={locale}
      className="relative overflow-hidden rounded-[32px] border border-[#dce6ff] bg-gradient-to-b from-white via-[#f9fbff] to-[#f2f6ff] px-4 py-12 shadow-[0_12px_40px_rgba(0,26,110,0.05)] sm:px-8 lg:px-10"
    >
      {/* Subtle decorative background glow */}
      <div className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-[#1c4fe0]/6 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-[#001a6e]/5 blur-3xl" />

      {/* HEADER & CONTROLS */}
      <div className="relative z-10 mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d4e0ff] bg-white px-3.5 py-1.5 text-xs font-bold text-[#001a6e] shadow-xs">
            <Building2 className="h-3.5 w-3.5 text-[#1c4fe0]" />
            <span>{isRtl ? "عيادات معتمدة" : "Verified Clinics"}</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#001a6e] sm:text-3xl">
            {t("bestClinics.title", locale)}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5c6f9f]">
            {t("bestClinics.description", locale)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2" dir="ltr">
            <button
              type="button"
              aria-label="Previous clinic"
              className="best-clinics-prev flex h-10 w-10 items-center justify-center rounded-full border border-[#d1ddff] bg-white text-[#001a6e] shadow-xs transition-all hover:border-[#001a6e] hover:bg-[#001a6e] hover:text-white cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next clinic"
              className="best-clinics-next flex h-10 w-10 items-center justify-center rounded-full border border-[#d1ddff] bg-white text-[#001a6e] shadow-xs transition-all hover:border-[#001a6e] hover:bg-[#001a6e] hover:text-white cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Link
            href="/clinics"
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#cddaff] px-5 py-2.5 text-sm font-bold text-[#001a6e] shadow-xs transition-all hover:border-[#001a6e] hover:bg-[#001a6e] hover:text-white"
          >
            <span>{t("bestClinics.viewClinics", locale)}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* LOADING SKELETON */}
      {loading && (
        <div className="relative z-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-3xl border border-[#dce6ff] bg-white"
            >
              <div className="h-48 bg-slate-200" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-2/3 rounded-full bg-slate-200" />
                <div className="h-4 w-1/2 rounded-full bg-slate-100" />
                <div className="h-9 w-full rounded-xl bg-slate-200 mt-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR / EMPTY STATE */}
      {!loading && error && (
        <div className="relative z-10 rounded-2xl border border-red-100 bg-red-50/70 py-10 text-center text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && bestClinicsData.length === 0 && (
        <div className="relative z-10 rounded-2xl border border-[#dce6ff] bg-white py-12 text-center text-sm font-medium text-[#5c6f9f]">
          {isRtl ? "لا توجد عيادات متاحة حالياً." : "No clinics available right now."}
        </div>
      )}

      {/* CARDS */}
      {!loading && !error && bestClinicsData.length > 0 && (
        <div className="relative z-10 w-full overflow-hidden">
          <Swiper
            key={`${locale}-${bestClinicsData.length}`}
            dir={isRtl ? "rtl" : "ltr"}
            spaceBetween={20}
            modules={[Navigation]}
            breakpoints={{
              0: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            navigation={{
              prevEl: ".best-clinics-prev",
              nextEl: ".best-clinics-next",
            }}
          >
            {bestClinicsData.map((clinic, index) => {
              const fallbackImg = CLINIC_FALLBACK_IMAGES[index % CLINIC_FALLBACK_IMAGES.length];
              return (
                <SwiperSlide key={clinic.id || clinic.name} className="pb-2">
                  <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#dce6ff] bg-white shadow-[0_8px_28px_rgba(0,26,110,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#b9ccff] hover:shadow-[0_20px_50px_rgba(0,26,110,0.14)]">
                    {/* Top accent bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-[#001a6e] to-[#0036d9]" />

                    {/* IMAGE */}
                    <div className="relative h-48 overflow-hidden bg-[#edf2ff]">
                      <Image
                        src={clinic.imageSrc || fallbackImg}
                        alt={clinic.name}
                        fill
                        unoptimized={Boolean(clinic.imageSrc)}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#001a6e]/45 via-transparent to-transparent" />

                      {/* Verified pill */}
                      <div className={`absolute top-3 ${isRtl ? "right-3" : "left-3"} inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#001a6e] shadow-sm backdrop-blur-xs`}>
                        <BadgeCheck className="h-3.5 w-3.5 text-[#1c4fe0]" />
                        <span>{isRtl ? "معتمدة" : "Verified"}</span>
                      </div>

                      {/* Rating pill */}
                      <div className={`absolute bottom-3 ${isRtl ? "left-3" : "right-3"} inline-flex items-center gap-1 rounded-full bg-[#001a6e]/90 px-2.5 py-1 text-xs font-bold text-white shadow-md backdrop-blur-xs`}>
                        <Star className="h-3.5 w-3.5 fill-[#ffd84d] text-[#ffd84d]" />
                        <span>{clinic.rating.toFixed(1)}</span>
                        {clinic.totalRatings > 0 && (
                          <span className="text-[10px] font-medium text-white/80">
                            ({clinic.totalRatings})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div className="space-y-2.5">
                        <h3 className="line-clamp-1 text-lg font-extrabold text-[#0f1b3d] transition-colors group-hover:text-[#001a6e]">
                          {clinic.name}
                        </h3>

                        <div className="flex items-center gap-2 text-sm text-[#5a6f9f]">
                          <MapPin className="h-4 w-4 shrink-0 text-[#1c4fe0]" />
                          <span className="line-clamp-1">{clinic.location}</span>
                        </div>

                        {clinic.phone && (
                          <div className="flex items-center gap-2 text-xs font-medium text-[#6d7da7]">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-[#1c4fe0]" />
                            <span dir="ltr">{clinic.phone}</span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={getClinicProfileHref(clinic)}
                        className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#001a6e] to-[#0036d9] text-[13px] font-bold text-white shadow-md shadow-[#001a6e]/15 transition-all duration-200 hover:shadow-lg hover:shadow-[#001a6e]/25 hover:brightness-110"
                      >
                        <span>{isRtl ? "عرض العيادة والأطباء" : "View Clinic"}</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      )}
    </section>
  );
}
