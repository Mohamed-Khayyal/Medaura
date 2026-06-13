"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

interface Patient {
  id: string;
  name: string;
  email: string;
  age: number | string;
  status: string;
  lastVisit: string;
  img: string;
}

const statusColors: any = {
  active: "bg-green-100 text-green-600",
  under_treatment: "bg-purple-100 text-purple-600",
  recovered: "bg-blue-100 text-blue-600",
};

export default function PatientsTable() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const isRtl = locale === "ar";

  const pageSize = 3;

  useEffect(() => {
    async function loadPatients() {
      try {
        setLoading(true);
        const response = await fetch("/api/bookings/my-bookings", {
          credentials: "include",
        });
        const result = await response.json();
        if (response.ok && result.success && Array.isArray(result.data)) {
          const uniquePatientsMap = new Map<string, any>();
          
          result.data.forEach((b: any) => {
            const key = b.patient_phone || b.patient_name || String(b.booking_id);
            if (!key) return;

            const existing = uniquePatientsMap.get(key);
            if (
              !existing ||
              new Date(b.booking_date) > new Date(existing.booking_date)
            ) {
              uniquePatientsMap.set(key, b);
            }
          });

          const mappedPatients = Array.from(uniquePatientsMap.values()).map((b: any) => {
            const dateStr = b.booking_date ? new Date(b.booking_date).toISOString().slice(0, 10) : "—";
            return {
              id: String(b.booking_id),
              name: b.patient_name || "Unknown",
              email: b.patient_phone || t("doctorDashPages.todayAppointments.patientPhone", locale),
              age: "--",
              status: b.status === "confirmed" ? "active" : b.status === "completed" ? "recovered" : "under_treatment",
              lastVisit: dateStr,
              img: b.patient_photo || "/images/blank-profile-picture.png",
            };
          });

          setData(mappedPatients);
        }
      } catch (error) {
        console.error("Failed to load patients", error);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, [locale]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase());

      const matchFilter = filter === "all" || item.status === filter;

      return matchSearch && matchFilter;
    });
  }, [data, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

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

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const router = useRouter();

  const filters = [
    { value: "all", label: t("doctorDashPages.notificationsPage.filterAll", locale) },
    { value: "active", label: t("doctorDashPages.patientsPage.active", locale) },
    { value: "under_treatment", label: t("doctorDashPages.patientsPage.underTreatment", locale) },
    { value: "recovered", label: t("doctorDashPages.patientsPage.recovered", locale) },
  ];

  const getStatusLabel = (status: string) => {
    if (status === "active") return t("doctorDashPages.patientsPage.active", locale);
    if (status === "recovered") return t("doctorDashPages.patientsPage.recovered", locale);
    return t("doctorDashPages.patientsPage.underTreatment", locale);
  };

  return (
    <div className="flex min-w-0 flex-col gap-5 rounded-2xl border border-(--card-border) bg-(--card-bg) p-3 sm:gap-6 sm:p-4" dir={isRtl ? "rtl" : "ltr"}>
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex w-full flex-wrap gap-2 md:w-auto">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                setPage(1);
              }}
              className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-all duration-300 cursor-pointer sm:flex-none sm:px-4 sm:text-sm
        ${
          filter === f.value
            ? "bg-[#001A6E] text-white font-medium"
            : "bg-(--btn-bg) border border-(--input-border) text-(--text-primary) hover:bg-(--semi-card-bg)"
        }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder={t("doctorDashPages.patientTable.searchPlaceholder", locale)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full py-3 rounded-full bg-(--input2-bg) border border-(--input-border) text-sm outline-none placeholder:text-(--text-secondary) focus:ring-2 focus:ring-(--primary) transition ${
              isRtl ? "pl-4 pr-10 text-right placeholder:text-right" : "pr-4 pl-10 text-left placeholder:text-left"
            }`}
          />
          <Search
            size={16}
            className={`absolute top-1/2 -translate-y-1/2 text-(--text-primary) ${
              isRtl ? "right-3" : "left-3"
            }`}
          />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {loading ? (
          <div className="py-8 text-center text-(--text-secondary)">
            {t("doctorDashPages.todayAppointments.loading", locale)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-8 text-center text-(--text-secondary)">
            {t("doctorDashPages.patientTable.noRecords", locale)}
          </div>
        ) : (
          paginated.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() =>
                router.push(`/doctorDash/pages/patients/${patient.id}`)
              }
              className="w-full rounded-xl border border-(--card-border) bg-(--semi-card-bg) p-4 text-start transition hover:border-[#1F2B6C]/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={patient.img}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                  alt={patient.name}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-(--text-primary)">
                    {patient.name}
                  </p>
                  <p className="truncate text-xs text-(--text-secondary)">
                    {patient.email}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${
                    statusColors[patient.status]
                  }`}
                >
                  {getStatusLabel(patient.status)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-(--card-border) pt-3 text-center">
                <div className="min-w-0">
                  <p className="text-[10px] text-(--text-secondary)">
                    {t("doctorDashPages.appointmentsTable.colPatientId", locale)}
                  </p>
                  <p className="truncate text-xs font-semibold text-(--text-primary)">
                    {patient.id}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-(--text-secondary)">
                    {t("doctorDashPages.patientTable.colAge", locale)}
                  </p>
                  <p className="text-xs font-semibold text-(--text-primary)">
                    {patient.age}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-(--text-secondary)">
                    {t("doctorDashPages.patientTable.colLastVisit", locale)}
                  </p>
                  <p className="text-xs font-semibold text-(--text-primary)">
                    {patient.lastVisit}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden w-full overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="text-(--text-primary) text-base border-b border-(--card-border)">
            <tr className="text-center">
              <th className="pb-3">{t("doctorDashPages.patientTable.colLastVisit", locale)}</th>
              <th className="pb-3">{t("doctorDashPages.appointmentsTable.colStatus", locale)}</th>
              <th className="pb-3">{t("doctorDashPages.patientTable.colAge", locale)}</th>
              <th className="pb-3">{t("doctorDashPages.appointmentsTable.colPatientId", locale)}</th>
              <th className={`pb-3 ${isRtl ? "text-right pr-4" : "text-left pl-4"}`}>{t("doctorDashPages.patientTable.colPatient", locale)}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-(--text-secondary)">
                  {t("doctorDashPages.todayAppointments.loading", locale)}
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-(--text-secondary)">
                  {t("doctorDashPages.patientTable.noRecords", locale)}
                </td>
              </tr>
            ) : (
              paginated.map((p, i) => (
                <tr
                  key={p.id}
                  className="text-(--text-primary) border-b border-(--card-border)/50 hover:bg-(--semi-card-bg) transition text-center cursor-pointer"
                  onClick={() => router.push(`/doctorDash/pages/patients/${p.id}`)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && router.push(`/doctorDash/pages/patients/${p.id}`)
                  }
                >
                  <td className="py-4">{p.lastVisit}</td>
                  {/* Status */}
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        statusColors[p.status]
                      }`}
                    >
                      {getStatusLabel(p.status)}
                    </span>
                  </td>

                  <td className="py-4">{p.age}</td>
                  <td className="py-4">{p.id}</td>

                  {/* Patient */}
                  <td className="py-4">
                    <div className={`flex items-center gap-3 px-4 ${isRtl ? "justify-end" : "justify-start"}`}>
                      {!isRtl && (
                        <img
                          src={p.img}
                          className="w-9 h-9 rounded-full object-cover"
                          alt={p.name}
                        />
                      )}
                      <div className={isRtl ? "text-right" : "text-left"}>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-(--text-secondary)">{p.email}</p>
                      </div>
                      {isRtl && (
                        <img
                          src={p.img}
                          className="w-9 h-9 rounded-full object-cover"
                          alt={p.name}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/*  Pagination */}
      <div className="mt-2 flex flex-col items-center justify-between gap-3 text-sm sm:mt-4 sm:flex-row sm:gap-4">
        <div className="order-2 flex max-w-full flex-wrap items-center justify-center gap-2 sm:order-1">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="flex cursor-pointer items-center justify-center rounded-md border border-(--input-border) p-1.5 text-2xl text-(--text-primary) transition hover:bg-(--semi-card-bg) disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isRtl ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>

          {getPages().map((p, i) => (
            <button
              key={i}
              onClick={() => typeof p === "number" && setPage(p)}
              disabled={p === "..."}
              className={`px-3 py-1 rounded cursor-pointer transition ${
                p === page
                  ? "bg-[#1F2B6C] text-white font-medium"
                  : p === "..."
                    ? "cursor-default text-gray-400"
                    : "border border-(--input-border) text-(--text-primary) hover:bg-(--semi-card-bg)"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="flex cursor-pointer items-center justify-center rounded-md border border-(--input-border) p-1.5 text-2xl text-(--text-primary) transition hover:bg-(--semi-card-bg) disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isRtl ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
          </button>
        </div>
        <p className="text-(--text-secondary) order-1 sm:order-2">
          {t("doctorDashPages.appointmentsTable.showing", locale)
            .replace("{from}", String(filtered.length > 0 ? (page - 1) * pageSize + 1 : 0))
            .replace("{to}", String(Math.min(page * pageSize, filtered.length)))
            .replace("{total}", String(filtered.length))}
        </p>
      </div>
    </div>
  );
}
