"use client";

import { useState, useEffect } from "react";
import TodayOverview from "./charts/TodayOverview/TodayOverview";
import CasesDonut from "./charts/CasesDonut/CasesDonut";
import WeeklyBarChart from "./charts/WeeklyBarChart/WeeklyBarChart";
import TodayProgress from "./charts/TodayProgress/TodayProgress";
import TodayAppointmentsTaple from "./charts/TodayAppointmentsTaple/TodayAppointmentsTaple";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="p-4 flex flex-col gap-6">
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="col-span-1">
          <TodayProgress todayAppointments={dashboardData?.todayAppointments || []} />
        </div>

        {/* Right Column */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">

          <TodayOverview 
            totals={dashboardData?.totals} 
            todayCount={dashboardData?.todayAppointments?.length || 0} 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

            <CasesDonut 
              completed={completedCount} 
              confirmed={confirmedCount} 
              pending={pendingCount} 
            />

            <div className="md:col-span-2 lg:col-span-2">
              <WeeklyBarChart bookings={bookings} />
            </div>

          </div>

        </div>
      </div>
      <div className="">
        <TodayAppointmentsTaple />
      </div>
    </div>
  );
}