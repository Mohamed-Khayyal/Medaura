"use client";

import React, { createContext, useCallback, useEffect, useState } from "react";

type ThemeContextType = {
  darkMode: boolean;
  toggleTheme: () => void;
};

export const DashboardThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleTheme: () => {},
});

const STORAGE_KEY = "dashboard-theme";

export default function DashboardThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialise from localStorage so theme persists across page reloads
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "dark";
  });

  // Apply / remove the .dark class on the dashboard container whenever darkMode changes
  useEffect(() => {
    const container = document.querySelector("[data-theme-dashboard]");
    if (!container) return;
    if (darkMode) {
      container.classList.add("dark");
    } else {
      container.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  return (
    <DashboardThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}
