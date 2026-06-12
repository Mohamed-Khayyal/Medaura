"use client";

import StatsCard from "./components/ui/StatsCard";
import DashboardHeader from "./dashboardHeader/DashboardHeader";
import ChartBar from "./components/charts/ChartBar";
import AppointsmentRequests from "./features/appointments/AppointsmentRequests";
import VisitsGauge from "./components/charts/VisitsGauge";
import DoctorsList from "./features/doctors/doctorsList";
import ClinicsList from "./features/clinics/ClinicsList";
import DepartmentsChart from "./components/charts/DepartmentsChart";
import PatientsTable from "./features/clinics/PatientsTable";
import AppointmentsTable from "./features/appointments/AppointmentsTable";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  Users,
  Calendar,
  User,
  FileText,
  Activity,
  Wallet,
  ShieldCheck,
} from "lucide-react";

function Dashboard({ childern }: { childern: React.ReactNode }) {
  const [range, setRange] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const locale = useLocale();
  const isRtl = locale === "ar";

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/admin/admin-stats", {
          credentials: "include",
        });
        const result = await response.json();
        if (result?.success || result?.status === "success") {
          setDashboardData(result.data);
        }
        console.log("Dashboard Data:", result.data);
      } catch (error) {
        console.error("Failed to fetch admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const weeklyData = [
    { date: "2026-01-25", exixiting: 40, new: 20 },
    { date: "2026-01-26", exixiting: 50, new: 30 },
    { date: "2026-01-27", exixiting: 45, new: 25 },
    { date: "2026-01-28", exixiting: 60, new: 35 },
    { date: "2026-01-29", exixiting: 38, new: 22 },
    { date: "2026-01-30", exixiting: 55, new: 28 },
    { date: "2026-01-31", exixiting: 65, new: 32 },
  ];

  const filteredData = weeklyData.filter((item) => {
    if (!range?.from || !range?.to) return true;
    const itemDate = new Date(item.date);
    return itemDate >= range.from && itemDate <= range.to;
  });
  const stats = dashboardData?.stats ?? dashboardData ?? {};

  return (
    <div className="flex w-full" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex w-full flex-col bg-(--background) min-h-screen transition-colors duration-300">
        <div className="p-6">
          <DashboardHeader range={range} setRange={setRange} />

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title={t("adminDash.totalDoctors", locale)}
              value={stats?.totalDoctors ?? 0}
              percentage={18}
              icon={
                <Stethoscope size={20} strokeWidth={2} className="text-white" />
              }
              iconBg="bg-[#6A1B9A]"
              chartColor="#6A1B9A"
              data={[
                { value: 10 },
                { value: 20 },
                { value: 15 },
                { value: 25 },
                { value: 22 },
              ]}
            />

            <StatsCard
              title={t("adminDash.totalPatients", locale)}
              value={stats?.totalPatients ?? 0}
              percentage={20}
              icon={<User size={20} strokeWidth={2} className="text-white" />}
              iconBg="bg-[#1F6DB2]"
              chartColor="#1F6DB2"
              data={[
                { value: 5 },
                { value: 8 },
                { value: 6 },
                { value: 10 },
                { value: 9 },
              ]}
            />

            <StatsCard
              title={t("adminDash.totalClinics", locale)}
              value={stats?.totalClinics ?? 0}
              percentage={-15}
              icon={
                <Calendar size={20} strokeWidth={2} className="text-white" />
              }
              iconBg="bg-[#E65100]"
              chartColor="#E65100"
              data={[
                { value: 15 },
                { value: 18 },
                { value: 12 },
                { value: 20 },
                { value: 16 },
              ]}
            />

            <StatsCard
              title={t("adminDash.totalStaff", locale)}
              value={stats?.totalStaff ?? 0}
              percentage={5}
              icon={
                <ShieldCheck size={20} strokeWidth={2} className="text-white" />
              }
              iconBg="bg-[#00796B]"
              chartColor="#00796B"
              data={[
                { value: 4 },
                { value: 5 },
                { value: 4 },
                { value: 6 },
                { value: 5 },
              ]}
            />
          </div>

          {/* Charts + Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="lg:col-span-1">
              <ChartBar data={filteredData} />
            </div>

            <AppointsmentRequests requests={dashboardData?.pendingRequests} />
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <VisitsGauge male={69} female={56} total={80} />
            <DoctorsList doctors={dashboardData?.doctors} />
            <ClinicsList clinics={dashboardData?.clinics} />
          </div>

          {/* Table + Pie */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <PatientsTable patients={dashboardData?.patients} />
            </div>

            <div className="lg:col-span-1">
              <DepartmentsChart />
            </div>
          </div>

          {/* Appointments */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <AppointmentsTable appointments={dashboardData?.recentBookings} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
