"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MoreVertical, ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

type Appointment = {
  id: string;
  name: string;
  type: string;
  doctor: string;
  status: string;
  date: string;
};

type ApiListResult = {
  items: Appointment[];
  total: number;
};

export async function fetchAppointmentsFromApi(
  url = "/api/appointments",
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

  const items = await res.json();
  const totalHeader = res.headers.get("X-Total-Count");

  const total = totalHeader
    ? parseInt(totalHeader, 10)
    : Array.isArray(items)
      ? items.length
      : 0;

  return { items, total };
}

const getStatusColor = (status: string) => {
  if (!status) return "bg-gray-100 text-gray-600";
  const lower = status.toLowerCase();
  if (lower === "قريباً" || lower === "upcoming" || lower === "pending") {
    return "bg-purple-100 text-purple-600";
  }
  if (lower === "مكتمل" || lower === "completed" || lower === "confirmed") {
    return "bg-green-100 text-green-600";
  }
  return "bg-gray-100 text-gray-600";
};

export default function AppointmentsTable({
  appointments: initialAppointments,
}: {
  appointments?: Appointment[];
}) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [appointments, setAppointments] = useState<Appointment[]>(
    initialAppointments ?? [],
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(initialAppointments?.length ?? 0);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (initialAppointments !== undefined) {
      setAppointments(initialAppointments);
      setTotal(initialAppointments.length);
    }
  }, [initialAppointments]);

  const loadAppointments = async (pg = 1) => {
    setLoading(true);
    try {
      const res = await fetchAppointmentsFromApi(
        "/api/appointments",
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
    if (initialAppointments !== undefined) return;
    loadAppointments(page);
  }, [initialAppointments, page]);

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

  const paginated = useMemo(() => {
    return appointments.slice((page - 1) * pageSize, page * pageSize);
  }, [appointments, page]);

  const getStatusTranslated = (status: string) => {
    if (!status) return "";
    const lower = status.toLowerCase();
    if (lower === "قريباً" || lower === "upcoming" || lower === "pending") {
      return t("doctorDash.ongoingExam", locale) || (isRtl ? "قريباً" : "Upcoming");
    }
    if (lower === "مكتمل" || lower === "completed" || lower === "confirmed") {
      return isRtl ? "مكتمل" : "Completed";
    }
    return status;
  };

  const getSessionTypeTranslated = (type: string) => {
    if (!type) return "";
    const lower = type.toLowerCase();
    if (lower === "زيارة" || lower === "visit") return t("doctorDash.visit", locale);
    if (lower === "استشارة" || lower === "consultation") return t("doctorDash.consultation", locale);
    if (lower === "طوارئ" || lower === "emergency") return t("doctorDash.emergency", locale);
    return type;
  };

  const showingText = t("doctorDash.showingPatients", locale)
    .replace("{page}", String(page))
    .replace("{totalPages}", String(totalPages))
    .replace("{total}", String(appointments.length));

  return (
    <div 
      className="bg-(--card-bg) rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-(--card-border) w-full"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-(--text-primary)">
          {t("doctorDash.latestAppointments", locale)}
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-(--card-border)">
        <div className="sm:block overflow-x-auto">
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <p className="text-sm font-semibold text-(--text-primary)">
                {t("doctorDash.noAppointments", locale)}
              </p>
              <p className="text-xs text-(--text-secondary)">
                {t("doctorDash.noAppointmentsDesc", locale)}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-max text-xs sm:text-sm text-center">
              <thead className="bg-(--hover-bg) text-(--text-secondary) text-[11px] sm:text-xs">
                <tr>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2">{t("doctorDash.dateAndTime", locale)}</th>
                  <th className="px-3 py-2">{t("doctorDash.status", locale)}</th>
                  <th className="px-3 py-2">{t("doctorDash.doctor", locale)}</th>
                  <th className="px-3 py-2">{t("doctorDash.visitType", locale)}</th>
                  <th className="px-3 py-2">{t("doctorDash.patientName", locale)}</th>
                  <th className="px-3 py-2">{t("doctorDash.patientId", locale)}</th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((item, index) => (
                  <tr
                    key={index}
                    className="border-t border-(--card-border) hover:bg-(--hover-bg)"
                  >
                    <td className="px-3 py-2 text-(--text-secondary) relative">
                      <button
                        onClick={() => openMenu(item.id)}
                        className="p-1 rounded hover:bg-(--hover-bg)"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>

                    <td className="px-3 py-2 text-(--text-secondary)">
                      {item.date}
                    </td>

                    <td className="px-3 py-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          item.status,
                        )}`}
                      >
                        {getStatusTranslated(item.status)}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-(--text-secondary)">
                      {item.doctor}
                    </td>

                    <td className="px-3 py-2 text-(--text-secondary)">
                      {getSessionTypeTranslated(item.type)}
                    </td>

                    <td className="px-3 py-2 font-medium text-(--text-primary)">
                      {item.name}
                    </td>

                    <td className="px-3 py-2 text-(--text-secondary)">
                      {item.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="cursor-pointer text-lg flex items-center justify-center border border-(--input-border) rounded-md p-1 hover:bg-(--semi-card-bg) transition"
          >
            {isRtl ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
          </button>

          {getPages().map((p, i) => (
            <button
              key={i}
              onClick={() => typeof p === "number" && setPage(p)}
              disabled={p === "..."}
              className={`px-2 py-1 rounded text-xs cursor-pointer ${
                p === page
                  ? "bg-[color:var(--primary)] text-white"
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
            className="cursor-pointer text-lg flex items-center justify-center border border-(--input-border) rounded-md p-1 hover:bg-(--semi-card-bg) transition"
          >
            {isRtl ? <ChevronLeft size={19} /> : <ChevronRight size={19} />}
          </button>
        </div>

        <p className="text-xs text-(--text-secondary)">
          {showingText}
        </p>
      </div>
    </div>
  );
}
