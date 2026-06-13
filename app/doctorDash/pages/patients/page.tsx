"use client";

import StatCard from "./charts/StatsCard";
import DonutChart from "./charts/DonutChart";
import PatientProgress from "./charts/PatientProgress";
import PatientsTable from "./charts/PatientTaple";
import { Download } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

export default function PatientsStats() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const isRtl = locale === "ar";

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/bookings/my-bookings");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setBookings(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const computedData = useMemo(() => {
    if (!bookings.length) {
      return {
        stats: [
          { title: t("doctorDashPages.patientsPage.totalPatients", locale), value: 0, change: 0 },
          { title: t("doctorDashPages.patientsPage.newPatients", locale), value: 0, change: 0 },
          { title: t("doctorDashPages.patientsPage.underTreatment", locale), value: 0, change: 0 },
          { title: t("doctorDashPages.patientsPage.noVisits", locale), value: 0, change: 0 },
        ],
        donutData: [
          { name: t("doctorDashPages.patientsPage.active", locale), value: 0, color: "#0B8A13" },
          { name: t("doctorDashPages.patientsPage.recovered", locale), value: 0, color: "#0F2A7A" },
          { name: t("doctorDashPages.patientsPage.underTreatment", locale), value: 0, color: "#7B1FA2" },
        ],
        weeklyData: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, exciting: 0 })),
      };
    }

    // Group bookings by patient
    const uniquePatientsMap = new Map<string, any[]>();
    bookings.forEach((b) => {
      const key = b.patient_phone || b.patient_name || String(b.booking_id);
      if (!key) return;
      if (!uniquePatientsMap.has(key)) {
        uniquePatientsMap.set(key, []);
      }
      uniquePatientsMap.get(key)!.push(b);
    });

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    let newPatientsCount = 0;
    let activeCount = 0;
    let recoveredCount = 0;
    let underTreatmentCount = 0;
    let noVisitsCount = 0;

    uniquePatientsMap.forEach((patientBookings) => {
      // Find the first booking date
      const sorted = [...patientBookings].sort(
        (a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()
      );
      const firstBooking = sorted[0];
      const firstDate = new Date(firstBooking.booking_date);
      if (firstDate >= thirtyDaysAgo) {
        newPatientsCount++;
      }

      // Latest booking status
      const latestBooking = sorted[sorted.length - 1];
      const status = latestBooking.status;
      if (status === "confirmed") {
        activeCount++;
      } else if (status === "completed") {
        recoveredCount++;
      } else if (status === "pending" || status === "approved") {
        underTreatmentCount++;
      } else if (status === "cancelled" || status === "rejected") {
        noVisitsCount++;
      }
    });

    const totalPatients = uniquePatientsMap.size;

    // Monthly stats for chart
    const monthCounts = new Array(12).fill(0);
    bookings.forEach((b) => {
      if (!b.booking_date) return;
      const d = new Date(b.booking_date);
      if (!isNaN(d.getTime())) {
        const monthIndex = d.getMonth(); // 0 to 11
        monthCounts[monthIndex]++;
      }
    });

    const weeklyData = monthCounts.map((count, index) => ({
      month: index + 1,
      exciting: count,
    }));

    return {
      stats: [
        {
          title: t("doctorDashPages.patientsPage.totalPatients", locale),
          value: totalPatients,
          change: 0,
        },
        {
          title: t("doctorDashPages.patientsPage.newPatients", locale),
          value: newPatientsCount,
          change: 0,
        },
        {
          title: t("doctorDashPages.patientsPage.underTreatment", locale),
          value: underTreatmentCount,
          change: 0,
        },
        {
          title: t("doctorDashPages.patientsPage.noVisits", locale),
          value: noVisitsCount,
          change: 0,
        },
      ],
      donutData: [
        { name: t("doctorDashPages.patientsPage.active", locale), value: activeCount, color: "#0B8A13" },
        { name: t("doctorDashPages.patientsPage.recovered", locale), value: recoveredCount, color: "#0F2A7A" },
        { name: t("doctorDashPages.patientsPage.underTreatment", locale), value: underTreatmentCount, color: "#7B1FA2" },
      ],
      weeklyData,
    };
  }, [bookings, locale]);

  return (
    <div className="min-w-0 space-y-4 px-2 py-3 sm:px-4 sm:py-4" dir={isRtl ? "rtl" : "ltr"}>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <button className="order-2 flex w-full items-center justify-center gap-2 rounded-lg border border-(--input-border) bg-(--input-bg) px-3 py-2 text-sm transition hover:bg-(--input-hover) sm:order-1 sm:w-auto">
          <Download size={16} />
          {t("doctorDashPages.patientsPage.exportData", locale)}
        </button>

        <div className="order-1 flex min-w-0 flex-col gap-1 text-start sm:order-2">
          <h2 className="text-xl font-semibold text-(--text-primary) sm:text-2xl">
            {t("doctorDashPages.patientsPage.title", locale)}
          </h2>
          <p className="text-xs text-(--text-secondary)">
            {t("doctorDashPages.patientsPage.subtitle", locale)}
          </p>
        </div>

      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
        {computedData.stats.map((item, i) => (
          <StatCard key={i} {...item} />
        ))}
      </div>
      <div className="mb-6 grid min-w-0 grid-cols-1 gap-4 lg:mb-8 lg:grid-cols-3 lg:gap-8">
        <div className="min-w-0 lg:col-span-1">
          <DonutChart data={computedData.donutData} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <PatientProgress data={computedData.weeklyData} />
        </div>
      </div>
      <div>
        <PatientsTable />
      </div>
    </div>
  );
}
