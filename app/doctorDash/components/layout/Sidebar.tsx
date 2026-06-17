"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Users,
  Calendar,
  Bell,
  Settings,
  LayoutDashboard,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useLocale } from "@/lib/hooks";
import { t } from "@/i18n";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { user } = useAuth();
  const isStaff = user?.user_type?.toLowerCase() === "staff";

  const sidebarTitle = isStaff
    ? t("dashboard.sidebar.titleStaff", locale)
    : t("dashboard.sidebar.titleDoctor", locale);

  const menu = [
    {
      title: t("dashboard.sidebar.home", locale),
      items: [
        {
          text: t("dashboard.sidebar.dashboard", locale),
          icon: <LayoutDashboard size={16} />,
          href: "/doctorDash",
        },
      ],
    },
    {
      title: t("dashboard.sidebar.healthcare", locale),
      items: [
        {
          text: t("dashboard.sidebar.patients", locale),
          icon: <Users size={16} />,
          href: "/doctorDash/pages/patients",
        },
        {
          text: t("dashboard.sidebar.appointments", locale),
          icon: <Calendar size={16} />,
          href: "/doctorDash/pages/appointments",
        },
        {
          text: t("dashboard.sidebar.prescriptions", locale),
          icon: <FileText size={16} />,
          href: "/doctorDash/pages/prescriptions",
        },
      ],
    },
    {
      title: t("dashboard.sidebar.management", locale),
      items: [
        {
          text: t("dashboard.sidebar.financialManagement", locale),
          icon: <TrendingUp size={16} />,
          href: "/doctorDash/financial",
        },
        {
          text: t("dashboard.sidebar.notifications", locale),
          icon: <Bell size={16} />,
          href: "/doctorDash/notifications",
        },
        {
          text: t("dashboard.sidebar.settings", locale),
          icon: <Settings size={16} />,
          href: "/doctorDash/settings",
        },
      ],
    },
  ];

  const sidebarPositionClass = isRtl
    ? `fixed inset-y-0 right-0 z-50 h-screen w-64 bg-[#182a53] text-white px-4 pb-4 space-y-4 overflow-auto shadow-2xl lg:shadow-none transform lg:sticky lg:top-0 transition-transform duration-300 ease-in-out border-l border-white/10 ${
        open ? "translate-x-0 lg:translate-x-0" : "translate-x-full lg:translate-x-0"
      }`
    : `fixed inset-y-0 left-0 z-50 h-screen w-64 bg-[#182a53] text-white px-4 pb-4 space-y-4 overflow-auto shadow-2xl lg:shadow-none transform lg:sticky lg:top-0 transition-transform duration-300 ease-in-out border-r border-white/10 ${
        open ? "translate-x-0 lg:translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`;

  return (
    <div className={sidebarPositionClass} dir={isRtl ? "rtl" : "ltr"}>
      {/* Sticky Header Container */}
      <div className="sticky top-0 z-10 bg-[#182a53] pt-4 pb-2">
        <button
          className="lg:hidden mb-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className={`flex items-center justify-between border-b border-white/10 pb-4 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <div className="relative h-10 w-10 shrink-0">
              <Image
                src="/images/Logo1.png"
                alt="Medaura logo"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <h1 className="text-xl font-bold tracking-wide">Medaura</h1>
              <p className="text-[10px] text-white/60">{sidebarTitle}</p>
            </div>
          </div>
          <span className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
            {isStaff ? "ST" : "MD"}
          </span>
        </div>
      </div>

      {menu.map((section, i) => (
        <div key={i}>
          <span className={`text-[10px] text-white/55 mb-2.5 block uppercase tracking-[0.2em] ${isRtl ? "text-right" : "text-left"}`}>
            {section.title}
          </span>

          <div className="space-y-1">
            {section.items.map((item, index) => {
              const isActive =
                item.href === "/doctorDash"
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
                    <span
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:-rotate-6 ${
                        isActive ? "text-white" : ""
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className={`text-[13px] flex-1 ${isRtl ? "text-right" : "text-left"}`}>
                      {item.text}
                    </span>
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
