"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

interface Doctor {
  id?: number;
  doctor_id?: number;
  name?: string;
  full_name?: string;
  specialty?: string;
  specialist?: string;
  image?: string;
  photo?: string;
  status?: "available" | "busy";
  verified?: boolean;
}

const DOCTOR_FALLBACK_IMAGE = "/images/blank-profile-picture.png";

function getDoctorId(doctor: Doctor) {
  return doctor.doctor_id || doctor.id || 0;
}

function getDoctorVerified(doctor: Doctor) {
  const record = doctor as Record<string, unknown>;
  const raw =
    doctor.verified ??
    record.is_verified ??
    record.isVerified ??
    record.verify_status ??
    record.verified_status;

  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw === 1;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }

  return false;
}

function normalizeDoctor(doctor: Doctor): Doctor {
  return {
    ...doctor,
    id: getDoctorId(doctor),
    verified: getDoctorVerified(doctor),
  };
}

function normalizeDoctors(list: Doctor[]) {
  return list.map(normalizeDoctor);
}

export default function DoctorsList({
  doctors: doctorsProp,
}: {
  doctors?: Doctor[];
}) {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>(() =>
    normalizeDoctors(doctorsProp || []),
  );
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(!doctorsProp?.length);

  useEffect(() => {
    if (doctorsProp) {
      setDoctors(normalizeDoctors(doctorsProp));
    }
  }, [doctorsProp]);

  useEffect(() => {
    let active = true;

    async function loadAllDoctors() {
      try {
        const response = await fetch("/api/admin/doctors", {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          return;
        }

        const list = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.doctors)
            ? result.doctors
            : Array.isArray(result.data?.doctors)
              ? result.data.doctors
              : [];

        if (active) {
          setDoctors(normalizeDoctors(list));
        }
      } catch (error) {
        console.error("Failed to load doctors:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAllDoctors();

    return () => {
      active = false;
    };
  }, []);

  const handleVerify = async (doctor: Doctor, verify: boolean) => {
    if (verify && doctor.verified) {
      return;
    }

    const id = getDoctorId(doctor);
    if (!id) {
      console.error("Cannot update doctor verification: missing doctor id");
      return;
    }

    setLoadingId(id);
    try {
      const endpoint = verify
        ? `/api/admin/${id}/verify`
        : `/api/admin/${id}/unverify`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        setDoctors((prev) =>
          prev.map((doctor) =>
            getDoctorId(doctor) === id
              ? { ...doctor, verified: verify }
              : doctor,
          ),
        );
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("admin:doctors-updated"));
        }
      }
    } catch (error) {
      console.error("Failed to update doctor verification:", error);
      if (verify && doctor.verified) {
        return;
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className=" bg-(--card-bg) border border-(--card-border) h-max rounded-xl shadow-sm">
      {/* header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-(--card-border) mb-6 p-6">
        <button
          onClick={() => router.push("/dashboard/pages/doctors/requests")}
          className="w-full sm:w-auto border-2 border-(--card-border) px-3 py-2 rounded-[5px] text-sm text-(--text-primary) font-normal cursor-pointer hover:text-white hover:bg-[#1F2B6C] transition-colors duration-500"
        >
          عرض الكل
        </button>

        <h1 className="text-2xl font-bold text-(--text-primary)">الأطباء</h1>
      </div>

      {/* Doctors */}
      <div className="space-y-4 sm:space-y-2.5 px-4 sm:px-6 py-2 pb-6">
        {loading && doctors.length === 0 && (
          <div className="py-8 text-center text-(--text-secondary)">
            جاري تحميل الأطباء...
          </div>
        )}

        {!loading && doctors.length === 0 && (
          <div className="py-8 text-center text-(--text-secondary)">
            لا يوجد أطباء
          </div>
        )}

        {doctors.slice(0, 7).map((doctor, index) => (
          <div
            key={`${getDoctorId(doctor) || "doctor"}-${index}`}
            className="flex items-center justify-between p-3 sm:p-4 bg-(--semi-card-bg) rounded-lg hover:bg-(--hover-bg) transition-colors"
          >
            {/* Doctor Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={
                  doctor.photo?.trim() ||
                  doctor.image?.trim() ||
                  DOCTOR_FALLBACK_IMAGE
                }
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
                alt={doctor.name || doctor.full_name}
              />

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-(--text-primary) text-sm sm:text-base truncate">
                  {doctor.name || doctor.full_name}
                </p>

                <p className="text-xs sm:text-sm text-(--text-secondary) truncate">
                  {doctor.specialty || doctor.specialist}
                </p>
              </div>
            </div>

            {/* Status Badge & Actions */}
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  doctor.verified
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {doctor.verified ? "مفعل" : "غير مفعل"}
              </span>

              <button
                onClick={() => handleVerify(doctor, !doctor.verified)}
                disabled={
                  loadingId === getDoctorId(doctor) || !getDoctorId(doctor)
                }
                className={`p-1.5 rounded-lg transition-colors ${
                  doctor.verified
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                } disabled:opacity-50`}
                title={doctor.verified ? "إلغاء التفعيل" : "تفعيل"}
              >
                {doctor.verified ? <X size={16} /> : <Check size={16} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
