"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDashboardPathByUserType } from "@/lib/utils/redirect";

interface RouteGuardProps {
  /** Roles that ARE allowed to view this route */
  allowedRoles: string[];
  children: React.ReactNode;
}

/**
 * Wraps a page/layout and enforces role-based access.
 *
 * Behaviour:
 * - While auth is loading  → shows a full-screen spinner (no flash)
 * - Not authenticated      → redirects to /login
 * - Wrong role             → redirects to the user's own dashboard
 */
export default function RouteGuard({ allowedRoles, children }: RouteGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  const userRole = user?.user_type?.toLowerCase() ?? "";
  const allowed = allowedRoles.map((r) => r.toLowerCase());
  const hasAccess = isAuthenticated && allowed.includes(userRole);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      // Not logged in → send to login
      router.replace("/login");
      return;
    }

    if (!hasAccess) {
      // Logged in but wrong role → send to their own dashboard
      router.replace(getDashboardPathByUserType(user?.user_type));
    }
  }, [loading, isAuthenticated, hasAccess, user, router]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f4f8]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9e3ff] border-t-[#001a6e]" />
          <p className="text-sm font-medium text-[#5a6ea8]">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // ── Not authenticated ────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f4f8]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9e3ff] border-t-[#001a6e]" />
          <p className="text-sm font-medium text-[#5a6ea8]">جاري التوجيه...</p>
        </div>
      </div>
    );
  }

  // ── Wrong role ───────────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f4f8]">
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Shield icon */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-red-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#0f1a4f]">غير مصرح بالوصول</h1>
            <p className="mt-1 text-[14px] text-gray-500">
              ليس لديك صلاحية لعرض هذه الصفحة.
            </p>
            <p className="mt-1 text-[13px] text-gray-400">
              سيتم توجيهك تلقائياً...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Authorised ───────────────────────────────────────────────────────────
  return <>{children}</>;
}
