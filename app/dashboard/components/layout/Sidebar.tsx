"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Stethoscope,
  ClipboardList,
  Hospital,
  Calendar,
  Bell,
  Settings,
  UserRound,
  LayoutDashboard,
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
          icon: <LayoutDashboard size={18} />,
          href: "/dashboard",
        },
      ],
    },
    {
      title: "الرعاية الصحية",
      items: [
        { text: "المرضى", icon: <Users size={18} />, href: "/dashboard/pages/patients" },
        { text: "الأطباء", icon: <Stethoscope size={18} />, href: "/dashboard/pages/doctors/requests" },
        { text: "المواعيد", icon: <Calendar size={18} />, href: "/dashboard/pages/appointments" },
        { text: "الزيارات", icon: <ClipboardList size={18} />, href: "/dashboard/visits" },
        { text: "العيادات", icon: <Hospital size={18} />, href: "/dashboard/clinics" },
      ],
    },
    {
      title: "الإدارة",
      items: [
        { text: "الموظفين", icon: <UserRound size={18} />, href: "/dashboard/staff" },
        { text: "سجلات التدقيق", icon: <FileText size={18} />, href: "/dashboard/audit-logs" },
        { text: "الإشعارات", icon: <Bell size={18} />, href: "/dashboard/notifications" },
        { text: "الإعدادات", icon: <Settings size={18} />, href: "/dashboard/settings" },
      ],
    },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 h-screen bg-[#1F2B6C] text-white p-6 space-y-6 overflow-auto shadow-2xl lg:shadow-none transform -translate-x-full lg:translate-x-0 lg:sticky lg:top-0 transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      
      <button
        className="lg:hidden mb-4 p-2 rounded-lg hover:bg-(--hover-bg) transition-colors"
        onClick={onClose}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h1 className="text-2xl font-bold mb-6">Medaura</h1>

      {menu.map((section, i) => (
        <div key={i}>
          <span className="text-xl text-white/70 mb-2 block uppercase tracking-wider text-right ">
            {section.title}
          </span>

          <div className="space-y-1 flex flex-col items-end">
            {section.items.map((item, index) => {
              const isActive =  item.href === "/dashboard"
                          ? pathname === item.href
                          : pathname.startsWith(item.href);
              return (
                <Link key={index} href={item.href} className="w-full block">
                  <div
                    className={`relative w-full flex items-center justify-end gap-3 p-2 mr-2 rounded-lg cursor-pointer transition-all duration-200 group
                    ${
                      isActive
                        ? "bg-(--card-bg) text-(--text-primary) font-semibold shadow-md"
                        : "hover:bg-(--card-bg) hover:text-(--text-primary)"
                    }`}
                  >
                    
                    {/* {isActive && (
                      <div className="absolute right-0 top-0 h-full w-1 bg-(--card-bg) rounded-l-lg"></div>
                    )} */}

                    <span className="text-sm flex-1 text-right">{item.text}</span>

                    <span
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:rotate-12 ${
                        isActive ? "text-(--text-primary)]" : ""
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