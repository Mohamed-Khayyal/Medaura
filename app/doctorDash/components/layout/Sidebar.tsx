"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Calendar,
  Bell,
  Settings,
  Send,
  LayoutDashboard,
  Building,
  FileText,
} from "lucide-react";
interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const menu = [
    {
      title: "الرئيسية",
      items: [
        {
          text: "لوحة القيادة",
          icon: <LayoutDashboard size={16} />,
          href: "/doctorDash",
        },
      ],
    },
    {
      title: "الرعاية الصحية",
      items: [
        {
          text: "المرضى",
          icon: <Users size={16} />,
          href: "/doctorDash/pages/patients",
        },
        {
          text: "المواعيد",
          icon: <Calendar size={16} />,
          href: "/doctorDash/pages/appointments",
        },
        {
          text: "الروشتات الطبية",
          icon: <FileText size={16} />,
          href: "/doctorDash/pages/prescriptions",
        },
      ],
    },
    {
      title: "الإدارة",
      items: [
        {
          text: "الإشعارات",
          icon: <Bell size={16} />,
          href: "/doctorDash/notifications",
        },
        {
          text: "الإعدادات",
          icon: <Settings size={16} />,
          href: "/doctorDash/settings",
        },
      ],
    },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 h-screen w-64 bg-[#182a53] text-white p-4 space-y-4 overflow-auto shadow-2xl lg:shadow-none transform -translate-x-full lg:translate-x-0 lg:sticky lg:top-0 transition-transform duration-300 ease-in-out border-r border-white/10 ${
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <button
        className="lg:hidden mb-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
        onClick={onClose}
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Medaura</h1>
          <p className="text-[11px] text-white/60 mt-1">لوحة الطبيب</p>
        </div>
        <span className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-[10px]">
          MD
        </span>
      </div>

      {menu.map((section, i) => (
        <div key={i}>
          <span className="text-[10px] text-white/50 mb-2.5 block uppercase tracking-[0.2em] text-right">
            {section.title}
          </span>

          <div className="space-y-1 flex flex-col items-end">
            {section.items.map((item, index) => {
              const isActive =
                item.href === "/doctorDash"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link key={index} href={item.href} className="w-full block">
                  <div
                    className={`relative w-full flex items-center justify-end gap-2 px-3 py-2 mr-1.5 rounded-xl cursor-pointer transition-all duration-200 group
                    ${
                      isActive
                        ? "bg-white/14 text-white font-semibold ring-1 ring-white/15 shadow-[0_10px_18px_rgba(0,0,0,0.2)]"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-[13px] flex-1 text-right">
                      {item.text}
                    </span>
                    <span
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:-rotate-6 ${
                        isActive ? "text-white" : ""
                      }`}
                    >
                      {item.icon}
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
