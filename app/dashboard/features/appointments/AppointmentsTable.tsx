"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MoreVertical, ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  patientId: string;
  patientNumber?: string;
  name: string;
  type: string;
  doctor: string;
  status: string;
  date: string;
};

type AdminBooking = {
  booking_id?: number | string;
  id?: number | string;
  booking_date?: string;
  booking_from?: string;
  booking_to?: string;
  date_time?: string;
  status?: string;
  doctor_name?: string | null;
  session_type?: string | null;
  patient_id?: number | string;
  patient_name?: string | null;
  patient_number?: string | null;
};

type ApiListResult = {
  items: Appointment[];
  total: number;
};

export async function fetchAppointmentsFromApi(
  url = "/api/admin/bookings",
  page = 1,
  limit = 10,
): Promise<ApiListResult> {
  const q = new URL(
    url,
    typeof window !== "undefined" ? window.location.origin : "http://localhost",
  );
  q.searchParams.set("page", String(page));
  q.searchParams.set("limit", String(limit));

  const res = await fetch(q.toString());
  if (!res.ok) throw new Error(`Failed to fetch appointments: ${res.status}`);

  const result = await res.json();
  const totalHeader = res.headers.get("X-Total-Count");
  const rawItems = Array.isArray(result)
    ? result
    : Array.isArray(result?.bookings)
      ? result.bookings
      : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.items)
          ? result.items
          : [];
  const items = rawItems.map(normalizeAppointment);

  const total = totalHeader
    ? parseInt(totalHeader, 10)
    : typeof result?.result === "number"
      ? result.result
      : items.length;

  return { items, total };
}

function normalizeAppointment(item: Appointment | AdminBooking): Appointment {
  if ("name" in item && "doctor" in item && "date" in item) {
    return {
      ...item,
      patientId: item.patientId ?? item.id,
      patientNumber: item.patientNumber ?? item.patientId ?? item.id,
    };
  }

  const booking = item as AdminBooking;
  const date = (booking.date_time ?? booking.booking_date ?? "").slice(0, 10);

  return {
    id: String(booking.booking_id ?? booking.id ?? booking.patient_id ?? ""),
    patientId: String(booking.patient_id ?? ""),
    patientNumber:
      booking.patient_number ??
      (booking.patient_id !== undefined ? String(booking.patient_id) : ""),
    name: booking.patient_name ?? "-",
    type: booking.session_type ?? "-",
    doctor: booking.doctor_name ?? "-",
    status: booking.status ?? "-",
    date: date || "-",
  };
}

function formatDateOnly(value: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return "-";

  const date = new Date(trimmed);

  if (isNaN(date.getTime())) return trimmed;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const getStatusColor = (status: string): React.CSSProperties => {
  const normalized = status.trim().toLowerCase();

  if (["pending", "قيد الانتظار"].includes(normalized)) {
    return {
      backgroundColor: "#fef9c2",
      color: "#a65f00",
      borderColor: "#fff085",
    };
  }

  if (
    ["confirmed", "approved", "مؤكد", "مؤكّد", "تمت الموافقة"].includes(
      normalized,
    )
  ) {
    return {
      backgroundColor: "#dbeafe",
      color: "#1d4ed8",
      borderColor: "#bfdbfe",
    };
  }

  if (["completed", "مكتمل", "مكتملة", "تمت", "منتهية"].includes(normalized)) {
    return {
      backgroundColor: "#dcfce7",
      color: "#15803d",
      borderColor: "#bbf7d0",
    };
  }

  if (
    [
      "cancelled",
      "canceled",
      "ملغي",
      "ملغى",
      "أُلغي",
      "اعتذر",
      "مرفوض",
    ].includes(normalized)
  ) {
    return {
      backgroundColor: "#ffe2e2",
      color: "#c10007",
      borderColor: "#ffc9c9",
    };
  }

  return {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    borderColor: "#e5e7eb",
  };
};

export default function AppointmentsTable({
  appointments: appointmentsProp,
}: {
  appointments?: (Appointment | AdminBooking)[];
}) {
  const [appointments, setAppointments] = useState<Appointment[]>(
    appointmentsProp?.map(normalizeAppointment) || [],
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(appointmentsProp?.length || 0);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (appointmentsProp !== undefined) {
      setAppointments(appointmentsProp.map(normalizeAppointment));
      setTotal(appointmentsProp.length);
    }
  }, [appointmentsProp]);

  const loadAppointments = async (pg = 1) => {
    setLoading(true);
    try {
      const res = await fetchAppointmentsFromApi(
        "/api/admin/bookings",
        pg,
        limit,
      );
      if (res && Array.isArray(res.items)) {
        setAppointments(res.items);
        setTotal(res.total ?? res.items.length);
      }
    } catch (err) {
      console.error("Error loading appointments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentsProp !== undefined) return;
    loadAppointments(page);
  }, [appointmentsProp, page]);

  const openMenu = (id: string) => {
    setMenuOpenId((prev) => (prev === id ? null : id));
  };
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(appointments.length / pageSize));
  const getPages = () => {
    const pages: (number | string)[] = [];

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
  const datas = useMemo(() => {
    return appointments;
  }, [appointments]);
  const paginated = datas.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-(--card-bg) rounded-2xl p-5 shadow-sm border border-(--card-border) w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-(--text-primary)">
          أحدث المواعيد
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-(--card-border)">
        <div className=" sm:block overflow-x-auto">
          <table className="w-full min-w-max text-sm text-right">
            <thead className="bg-(--hover-bg) text-center text-(--text-secondary)">
              <tr>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3">التاريخ والوقت</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">اسم الطبيب</th>
                <th className="px-4 py-3">نوع الجلسة</th>
                <th className="px-4 py-3">اسم المريض</th>
                <th className="px-4 py-3">رقم المريض</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((item, index) => (
                <tr
                  key={index}
                  className="border-t border-(--card-border) hover:bg-(--hover-bg) transition text-center"
                >
                  <td className="px-4 py-3 text-(--text-secondary) relative">
                    <button
                      onClick={() => openMenu(item.id)}
                      className="p-1 rounded hover:bg-(--hover-bg)"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>

                  <td className="px-4 py-3 text-(--text-secondary)">
                    {formatDateOnly(item.date)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className="inline-flex min-w-20 justify-center rounded-full border px-3 py-1 text-xs font-medium"
                      style={getStatusColor(item.status)}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-(--text-secondary)">
                    {item.doctor}
                  </td>

                  <td className="px-4 py-3 text-(--text-secondary)">
                    {item.type}
                  </td>

                  <td className="px-4 py-3 font-medium text-(--text-primary)">
                    {item.name}
                  </td>

                  <td
                    className="px-4 py-3 font-semibold text-(--text-primary)"
                    dir="ltr"
                  >
                    {item.patientNumber || item.patientId || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className=" cursor-pointer text-2xl flex items-center justify-center border border-(--input-border) rounded-md p-1 hover:bg-(--semi-card-bg) transition"
          >
            <ChevronLeft size={19} />
          </button>

          {getPages().map((p, i) => (
            <button
              key={i}
              onClick={() => typeof p === "number" && setPage(p)}
              disabled={p === "..."}
              className={`px-2 py-1 rounded cursor-pointer ${
                p === page
                  ? "bg-[#1F2B6C] text-white"
                  : p === "..."
                    ? "cursor-default text-gray-400"
                    : "border border-(--input-border) hover:bg-(--semi-card-bg)"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className=" cursor-pointer text-2xl flex items-center justify-center border border-(--input-border) rounded-md p-1 hover:bg-(--semi-card-bg) transition"
          >
            <ChevronRight size={19} />
          </button>
        </div>

        <p className="text-sm text-(--text-secondary)">
          عرض {page} - {totalPages} من أصل {datas.length} مريض
        </p>
      </div>
    </div>
  );
}
