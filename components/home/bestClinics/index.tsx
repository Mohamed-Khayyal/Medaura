"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "@/i18n";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { useLocale } from "@/lib/hooks";

const BEST_CLINICS_API_URL = "/api/clinic/best?limit=5";

type BestClinicApiItem = {
  clinic_id?: string | number;
  name?: string;
  location?: string;
  average_rating?: number;
  photo?: string | null;
};

type BestClinic = {
  id: string | number;
  name: string;
  location: string;
  rating: number;
  imageSrc?: string;
};

function mapBestClinic(clinic: BestClinicApiItem): BestClinic {
  return {
    id: clinic.clinic_id !== undefined && clinic.clinic_id !== null ? String(clinic.clinic_id) : "",
    name: clinic.name || "",
    location: clinic.location || "",
    rating: Number(clinic.average_rating ?? 0),
    imageSrc: clinic.photo?.trim() || undefined,
  };
}
function getClinicProfileHref(clinic: BestClinic) {
  return `/clinics/${clinic.id}`;
}
const clinics = [
  {
    name: "Medaura Prime Clinic",
    location: "Nasr City, Cairo",
    rating: 4.9,
    image: "/images/clinic1.png",
  },
  {
    name: "Medaura Care Center",
    location: "Smouha, Alexandria",
    rating: 4.8,
    image: "/images/clinic2.png",
  },
  {
    name: "Medaura Family Clinic",
    location: "Dokki, Giza",
    rating: 4.7,
    image: "/images/clinic3.png",
  },
];

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
    <motion.section
      key={locale}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      className="rounded-[30px] border border-[#d8e3ff] bg-white px-4 py-10 sm:px-6 lg:px-8"
    >
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="mb-6"
      >
        <h2 className="text-2xl font-extrabold text-[#001a6e] sm:text-3xl">
          {t("bestClinics.title", locale)}
        </h2>
        <p className="mt-2 text-sm text-[#6d7da7]">
          {t("bestClinics.description", locale)}
        </p>
      </motion.div>

      {/* CONTROLS ROW */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="mb-8 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4" dir="ltr">
          <div className="best-clinics-prev flex items-center gap-4 rounded-full border border-[#d1ddff] px-3 py-2 text-sm font-semibold text-[#001a6e] transition hover:bg-[#f4f7ff] cursor-pointer">
            <ChevronLeft />
          </div>
          <div className="best-clinics-next flex items-center gap-4 rounded-full border border-[#d1ddff] px-3 py-2 text-sm font-semibold text-[#001a6e] transition hover:bg-[#f4f7ff] cursor-pointer">
            <ChevronRight />
          </div>
        </div>

        <Link
          href="/clinics"
          className="rounded-full border border-[#d1ddff] px-4 py-2 text-sm font-semibold text-[#001a6e] transition hover:bg-[#f4f7ff]"
        >
          {t("bestClinics.viewClinics", locale)}
        </Link>
      </motion.div>

      {/* CARDS */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
        className="">
        <div className="w-full overflow-hidden">
          <Swiper
            key={locale}
            dir={locale === "ar" ? "rtl" : "ltr"}
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
            {bestClinicsData.map((clinic) => (
              <SwiperSlide key={clinic.name}>
                <motion.article
                  key={clinic.name}
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    show: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden rounded-3xl border border-[#dce6ff] bg-[#fafcff] shadow-[0_12px_30px_rgba(20,61,180,0.08)]"
                >
                  {/* IMAGE */}
                  <div className="relative h-48 overflow-hidden">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="relative h-full w-full"
                    >
                      <Image
                        src={
                          bestClinicsData.length > 0
                            ? clinic.imageSrc || "/images/clinic1.png"
                            : "/images/clinic2.png"
                        }
                        alt={clinic.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </motion.div>
                  </div>

                  {/* CONTENT */}
                  <div className="space-y-3 p-5">
                    <h3 className="text-lg font-extrabold text-[#102155] truncate">
                      {bestClinicsData.length > 0 ? clinic.name : clinic.name}
                    </h3>

                    <p className="inline-flex items-center gap-2 text-sm text-[#5a6f9f] w-full">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{clinic.location}</span>
                    </p>

                    <div className="flex items-center justify-between gap-4 pt-2">
                      <p className="inline-flex items-center gap-1 rounded-full bg-[#fff4d9] px-3 py-1 text-sm font-semibold text-[#875900]">
                        <Star className="h-4 w-4 fill-current" />
                        {clinic.rating}
                      </p>

                      <Link
                        href={getClinicProfileHref(clinic)}
                        className="rounded-full bg-[#001a6e] hover:bg-[#102155] px-4 py-1.5 text-xs font-semibold text-white transition-all shadow-sm cursor-pointer"
                      >
                        {isRtl ? "عرض الملف" : "View Profile"}
                      </Link>
                    </div>
                  </div>
                </motion.article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </motion.div>
    </motion.section>
  );
}
