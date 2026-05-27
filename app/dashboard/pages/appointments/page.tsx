"use client";

import React, { useEffect, useState } from "react";
import { MoreVertical , ChevronRight , ChevronLeft } from "lucide-react";

type Appointment = {
  id: string;
  name: string;
  type: string;
  doctor: string;
  status: string;
  date: string;
  doctor_image?: string | null;
  patient_image?: string | null;
  patient_id?: number | string;
  patient_number?: string | null;
};

const DOCTOR_FALLBACK_IMAGE = "/images/blank-profile-picture.png";

function normalizeAppointment(booking: any): Appointment {
  // Safe date extraction & formatting to beautiful Arabic format
  const rawDate = booking.booking_date || booking.date_time || booking.date || "";
  let formattedDate = rawDate;
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      formattedDate = new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    }
  }

  // Translate status to Arabic for a premium look
  const statusTranslations: Record<string, string> = {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    approved: "مقبول",
    completed: "مكتمل",
    cancelled: "ملغى",
    canceled: "ملغى",
    rejected: "مرفوض",
  };
  const rawStatus = (booking.status || "").trim().toLowerCase();
  const statusArabic = statusTranslations[rawStatus] || booking.status || "قيد الانتظار";

  // Translate session type
  const typeTranslations: Record<string, string> = {
    visit: "زيارة في العيادة",
    consultation: "استشارة",
  };
  const rawType = (booking.session_type || booking.type || "").trim().toLowerCase();
  const typeArabic = typeTranslations[rawType] || booking.session_type || booking.type || "زيارة";

  return {
    id: String(booking.booking_id || booking.id || ""),
    name: booking.patient_name || booking.name || "مريض مجهول",
    type: typeArabic,
    doctor: booking.doctor_name || booking.doctor || "طبيب مجهول",
    status: statusArabic,
    date: formattedDate || "غير محدد",
    doctor_image: booking.doctor_image || booking.photo || null,
    patient_image: booking.patient_image || booking.image || null,
    patient_id: booking.patient_id || "",
    patient_number: booking.patient_number || booking.patient_phone || "-",
  };
}

function Avatar({ src, name }: { src?: string | null; name: string }) {
  const [error, setError] = useState(false);

  if (src && !error) {
    return (
      <img
        src={src}
        onError={() => setError(true)}
        className="w-9 h-9 rounded-full object-cover border border-(--card-border) shrink-0"
        alt={name}
      />
    );
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#EBF2F9] border border-[#d2e3f0] text-[#1F2B6C] font-bold text-xs shrink-0">
      {initials || "م"}
    </div>
  );
}

const getStatusDetails = (status: string) => {
  const normalized = status.trim();

  if (["قيد الانتظار", "pending"].includes(normalized)) {
    return {
      label: "قيد الانتظار",
      classes: "bg-[#FFFDEB] text-[#8F5A00] border-[#FFE999]",
      dot: "bg-[#D98200]"
    };
  }

  if (["مؤكد", "مقبول", "confirmed", "approved"].includes(normalized)) {
    return {
      label: "مؤكد",
      classes: "bg-[#EDF5FF] text-[#004BB3] border-[#CCE0FF]",
      dot: "bg-[#0066FF]"
    };
  }

  if (["مكتمل", "مكتملة", "completed"].includes(normalized)) {
    return {
      label: "مكتمل",
      classes: "bg-[#EEFDF3] text-[#00702B] border-[#C2F7D4]",
      dot: "bg-[#00A83F]"
    };
  }

  if (["ملغى", "ملغي", "مرفوض", "cancelled", "canceled", "rejected"].includes(normalized)) {
    return {
      label: "ملغي",
      classes: "bg-[#FFF0F0] text-[#B00006] border-[#FFCCCC]",
      dot: "bg-[#E60008]"
    };
  }

  return {
    label: status,
    classes: "bg-gray-50 text-gray-600 border-gray-200",
    dot: "bg-gray-400"
  };
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        credentials: "include",
      });
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setAppointments(result.data.map(normalizeAppointment));
      }
    } catch (err) {
      console.error("Error loading appointments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(appointments.length / pageSize));
  const paginated = appointments.slice((page - 1) * pageSize, page * pageSize);

  const openMenu = (id: string) => {
    setMenuOpenId((prev) => (prev === id ? null : id));
  };

  const getPages = () => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 2) {
      return [1, 2, 3, ...(totalPages > 3 ? ["..."] : [])];
    }
    if (page >= totalPages - 1) {
      return [
        ...(totalPages > 3 ? ["..."] : []),
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return ["...", page - 1, page, page + 1, "..."];
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center py-20 text-center bg-(--card-bg) rounded-2xl border border-(--card-border) p-5 shadow-sm">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1F2B6C] border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-(--text-secondary)">جاري تحميل المواعيد...</p>
      </div>
    );
  }

  return (
    <div className="bg-(--card-bg) rounded-2xl p-5 shadow-sm border border-(--card-border) w-full" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5 border-b border-(--card-border) pb-4">
        <div>
          <h1 className="text-xl font-bold text-(--text-primary)">أحدث المواعيد</h1>
          <p className="text-xs text-(--text-secondary) mt-1">عرض وإدارة حجوزات ومواعيد المرضى في العيادات.</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-(--card-border) shadow-[var(--shadow-soft)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm text-right">
            <thead className="bg-[#EBF2F9]/50 text-right text-[#1F2B6C] border-b border-(--card-border) font-bold text-xs uppercase">
              <tr>
                <th className="px-5 py-4 text-center">الخيارات</th>
                <th className="px-5 py-4 text-right">التاريخ والوقت</th>
                <th className="px-5 py-4 text-right">الحالة</th>
                <th className="px-5 py-4 text-right">اسم الطبيب</th>
                <th className="px-5 py-4 text-right">نوع الجلسة</th>
                <th className="px-5 py-4 text-right">اسم المريض</th>
                <th className="px-5 py-4 text-right">رقم المريض</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-(--card-border)">
              {paginated.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-(--hover-bg) transition duration-150"
                >
                  <td className="px-5 py-4 text-center relative">
                    <button
                      onClick={() => openMenu(item.id)}
                      aria-expanded={menuOpenId === item.id}
                      className="p-1.5 rounded-lg hover:bg-(--hover-bg) text-(--text-secondary) transition cursor-pointer"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>

                  <td className="px-5 py-4 text-right text-(--text-secondary) font-medium">
                    {item.date}
                  </td>

                  <td className="px-5 py-4 text-right">
                    {(() => {
                      const details = getStatusDetails(item.status);
                      return (
                        <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold ${details.classes}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${details.dot}`} />
                          {details.label}
                        </span>
                      );
                    })()}
                  </td>

                  <td className="px-5 py-4 text-right text-(--text-primary) font-semibold">
                    <div className="flex items-center gap-2.5 justify-start">
                      <Avatar src={item.doctor_image} name={item.doctor} />
                      <span className="truncate">{item.doctor}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right text-(--text-secondary) font-medium">
                    <span className="inline-block bg-[#F1F5F9] px-2.5 py-0.5 rounded-md text-xs text-slate-600 font-semibold border border-slate-200">
                      {item.type}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right font-bold text-(--text-primary)">
                    <div className="flex items-center gap-2.5 justify-start">
                      <Avatar src={item.patient_image} name={item.name} />
                      <span className="truncate">{item.name}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right font-semibold text-(--text-secondary)" dir="ltr">
                    {item.patient_number}
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-(--text-secondary)">
                    لا يوجد مواعيد حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {appointments.length > 0 && (
        <div className="flex flex-col gap-3 mt-5 sm:flex-row sm:items-center sm:justify-between border-t border-(--card-border) pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="cursor-pointer h-9 w-9 flex items-center justify-center border border-(--input-border) rounded-xl hover:bg-(--semi-card-bg) transition text-(--text-secondary)"
            >
              <ChevronLeft size={17} />
            </button>

            {getPages().map((p, i) => (
              <button
                key={i}
                onClick={() => typeof p === "number" && setPage(p)}
                disabled={p === "..."}
                className={`h-9 min-w-9 rounded-xl px-3 cursor-pointer text-xs font-bold transition ${
                  p === page
                    ? "bg-[#1F2B6C] text-white shadow-md"
                    : p === "..."
                      ? "cursor-default text-gray-450"
                      : "border border-(--input-border) hover:bg-(--semi-card-bg) text-(--text-primary)"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="cursor-pointer h-9 w-9 flex items-center justify-center border border-(--input-border) rounded-xl hover:bg-(--semi-card-bg) transition text-(--text-secondary)"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <p className="text-xs font-semibold text-(--text-secondary)">
            عرض صفحة {page} من أصل {totalPages} (إجمالي المواعيد: {appointments.length})
          </p>
        </div>
      )}
    </div>
  );
}
