"use client";

import { useState, useEffect } from "react";
import TodayOverview from "./charts/TodayOverview/TodayOverview";
import CasesDonut from "./charts/CasesDonut/CasesDonut";
import WeeklyBarChart from "./charts/WeeklyBarChart/WeeklyBarChart";
import TodayProgress from "./charts/TodayProgress/TodayProgress";
import TodayAppointmentsTaple from "./charts/TodayAppointmentsTaple/TodayAppointmentsTaple";
import { useLocale } from "@/lib/hooks";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const isRtl = locale === "ar";

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dashRes, bookingsRes] = await Promise.all([
          fetch("/api/doctor-dashboard"),
          fetch("/api/bookings/my-bookings")
        ]);
        const dashJson = await dashRes.json();
        const bookingsJson = await bookingsRes.json();
        
        if (dashJson.success) {
          setDashboardData(dashJson.data);
        }
        if (bookingsJson.success && Array.isArray(bookingsJson.data)) {
          setBookings(bookingsJson.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const completedCount = bookings.filter(b => b.status === "completed").length;
  const confirmedCount = bookings.filter(b => b.status === "confirmed").length;
  const pendingCount = bookings.filter(b => b.status === "pending").length;

  return (
    <div className="flex min-w-0 flex-col gap-4 px-2 py-3 sm:gap-6 sm:px-4 sm:py-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="min-w-0 lg:col-span-1">
          <TodayProgress todayAppointments={dashboardData?.todayAppointments || []} />
        </div>

        {/* Right Column */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2 lg:gap-6">

          <TodayOverview 
            totals={dashboardData?.totals} 
            todayCount={dashboardData?.todayAppointments?.length || 0} 
          />

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">

            <CasesDonut 
              completed={completedCount} 
              confirmed={confirmedCount} 
              pending={pendingCount} 
            />

            <div className="min-w-0 md:col-span-2 lg:col-span-2">
              <WeeklyBarChart bookings={bookings} />
            </div>

          </div>

        </div>
      </div>
      <div className="min-w-0">
        <TodayAppointmentsTaple />
      </div>
    </div>
  );
}
