"use client";

import React, { createContext, useEffect } from "react";

type ThemeContextType = {
  darkMode: boolean;
  toggleTheme: () => void;
};

export const DashboardThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleTheme: () => {},
});

export default function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  // Dashboard is always light-mode — remove dark class if it was previously saved
  useEffect(() => {
    const dashboardContainer = document.querySelector("[data-theme-dashboard]");
    if (dashboardContainer) {
      dashboardContainer.classList.remove("dark");
    }
    localStorage.removeItem("dashboard-theme");
  }, []);

  return (
    <DashboardThemeContext.Provider value={{ darkMode: false, toggleTheme: () => {} }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}
