"use client";

import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";
import DashboardThemeProvider from "../providers/DashboardThemeProvider";
import RouteGuard from "@/components/auth/RouteGuard";
import { useLocale } from "@/lib/hooks";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <RouteGuard allowedRoles={["doctor", "staff"]}>
      <DashboardThemeProvider>
        <div
          className="min-h-screen flex bg-(--background) transition-all duration-700 ease-in-out"
          data-theme-dashboard
          dir={isRtl ? "rtl" : "ltr"}
        >
          {/* Sidebar */}
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Main Content */}
          <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out">
            <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

            <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="mx-auto w-full max-w-[1400px] rounded-[20px] bg-[radial-gradient(1200px_circle_at_0%_0%,rgba(31,111,235,0.05),transparent_50%),radial-gradient(900px_circle_at_100%_20%,rgba(25,167,181,0.05),transparent_60%)] p-4 sm:p-5">
                {children}
              </div>
            </main>
          </div>

          {/* Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
      </DashboardThemeProvider>
    </RouteGuard>
  );
}
