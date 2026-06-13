"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Stethoscope,
  Hospital,
  Calendar,
  Bell,
  Settings,
  UserRound,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const isRtl = locale === "ar";

  const menu = [
    {
      title: t("dashboard.sidebar.home", locale),
      items: [
        {
          text: t("dashboard.sidebar.dashboard", locale),
          icon: <LayoutDashboard size={18} />,
          href: "/dashboard",
        },
      ],
    },
    {
      title: t("dashboard.sidebar.healthcare", locale),
      items: [
        { text: t("dashboard.sidebar.patients", locale), icon: <Users size={18} />, href: "/dashboard/pages/patients" },
        { text: t("dashboard.sidebar.doctors", locale), icon: <Stethoscope size={18} />, href: "/dashboard/pages/doctors/requests" },
        { text: t("dashboard.sidebar.appointments", locale), icon: <Calendar size={18} />, href: "/dashboard/pages/appointments" },
        { text: t("dashboard.sidebar.clinicDoctors", locale), icon: <UserRound size={18} />, href: "/dashboard/pages/clinic-doctors" },
        { text: t("dashboard.sidebar.clinics", locale), icon: <Hospital size={18} />, href: "/dashboard/clinics" },
      ],
    },
    {
      title: t("dashboard.sidebar.management", locale),
      items: [
        { text: t("dashboard.sidebar.staff", locale), icon: <UserRound size={18} />, href: "/dashboard/pages/staff" },
        { text: t("dashboard.sidebar.auditLogs", locale), icon: <FileText size={18} />, href: "/dashboard/audit-logs" },
        { text: t("dashboard.sidebar.notifications", locale), icon: <Bell size={18} />, href: "/dashboard/notifications" },
        { text: t("dashboard.sidebar.settings", locale), icon: <Settings size={18} />, href: "/dashboard/settings" },
      ],
    },
  ];

  const sidebarPositionClass = isRtl
    ? `fixed inset-y-0 right-0 z-50 w-64 h-screen bg-[#1F2B6C] text-white p-6 space-y-6 overflow-auto shadow-2xl lg:shadow-none transform lg:sticky lg:top-0 transition-transform duration-300 ease-in-out border-l border-white/10 ${
        open ? "translate-x-0 lg:translate-x-0" : "translate-x-full lg:translate-x-0"
      }`
    : `fixed inset-y-0 left-0 z-50 w-64 h-screen bg-[#1F2B6C] text-white p-6 space-y-6 overflow-auto shadow-2xl lg:shadow-none transform lg:sticky lg:top-0 transition-transform duration-300 ease-in-out border-r border-white/10 ${
        open ? "translate-x-0 lg:translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`;

  return (
    <div className={sidebarPositionClass} dir={isRtl ? "rtl" : "ltr"}>
      
      <button
        className="lg:hidden mb-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
        onClick={onClose}
        aria-label="Close sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h1 className={`text-2xl font-bold mb-6 ${isRtl ? "text-right" : "text-left"}`}>{t("dashboard.sidebar.titleAdmin", locale)}</h1>

      {menu.map((section, i) => (
        <div key={i}>
          <span className={`text-xs font-semibold text-white/50 mb-2.5 block uppercase tracking-[0.2em] ${isRtl ? "text-right" : "text-left"}`}>
            {section.title}
          </span>

          <div className="space-y-1">
            {section.items.map((item, index) => {
              const isActive = item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link key={index} href={item.href} className="w-full block" onClick={onClose}>
                  <div
                    className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 group
                    ${isRtl ? "flex-row-reverse" : "flex-row"}
                    ${
                      isActive
                        ? "bg-white/15 text-white font-semibold ring-1 ring-white/15 shadow-[0_10px_18px_rgba(0,0,0,0.2)]"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className={`w-4 h-4 shrink-0 transition-transform group-hover:rotate-12 ${isActive ? "text-white" : ""}`}>
                      {item.icon}
                    </span>
                    <span className={`text-[13px] flex-1 ${isRtl ? "text-right" : "text-left"}`}>{item.text}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Sidebar;