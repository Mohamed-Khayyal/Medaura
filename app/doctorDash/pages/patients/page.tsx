"use client";

import StatCard from "./charts/StatsCard";
import DonutChart from "./charts/DonutChart";
import PatientProgress from "./charts/PatientProgress";
import PatientsTable from "./charts/PatientTaple";
import { Download } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

export default function PatientsStats() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          { title: "إجمالي المرضى", value: 0, change: 0 },
          { title: "مرضى جدد", value: 0, change: 0 },
          { title: "تحت العلاج", value: 0, change: 0 },
          { title: "بدون زيارة", value: 0, change: 0 },
        ],
        donutData: [
          { name: "نشط", value: 0, color: "#0B8A13" },
          { name: "متعافى", value: 0, color: "#0F2A7A" },
          { name: "تحت العلاج", value: 0, color: "#7B1FA2" },
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
      } else if (status === "pending") {
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
          title: "إجمالي المرضى",
          value: totalPatients,
          change: 0,
        },
        {
          title: "مرضى جدد",
          value: newPatientsCount,
          change: 0,
        },
        {
          title: "تحت العلاج",
          value: underTreatmentCount,
          change: 0,
        },
        {
          title: "بدون زيارة",
          value: noVisitsCount,
          change: 0,
        },
      ],
      donutData: [
        { name: "نشط", value: activeCount, color: "#0B8A13" },
        { name: "متعافى", value: recoveredCount, color: "#0F2A7A" },
        { name: "تحت العلاج", value: underTreatmentCount, color: "#7B1FA2" },
      ],
      weeklyData,
    };
  }, [bookings]);

  return (
    <div className="space-y-4 ">

      {/* Header */}
      <div className="flex items-center justify-between">

        <button className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-(--input-bg) border border-(--input-border) hover:bg-(--input-hover)">
          <Download size={16} />
          تصدير البيانات
        </button>

        <div className="text-right flex flex-col gap-3">
          <h2 className="font-semibold text-2xl text-(--text-primary)">إدارة المرضى</h2>
          <p className="text-xs text-(--text-secondary)">
            عرض ومتابعة جميع سجلات المرضى في العيادة
          </p>
        </div>

      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-7">
        {computedData.stats.map((item, i) => (
          <StatCard key={i} {...item} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-8">
        <div className=" col-span-1">
          <DonutChart data={computedData.donutData}  />
        </div>
        <div className=" col-span-2">
          <PatientProgress data={computedData.weeklyData}  /> 
        </div>
      </div>
      <div>
        <PatientsTable />
      </div>
    </div>
  );
}