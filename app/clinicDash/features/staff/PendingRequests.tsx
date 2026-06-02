"use client";

import { BadgeCheck, Clock, Stethoscope, User, Briefcase } from "lucide-react";
import {
  getStaffId,
  getStaffRoleLabel,
  getStaffRowKey,
  getStaffVerified,
} from "./staffIdentity";

export interface PendingStaffMember {
  id?: number;
  staff_id?: number | string;
  staffId?: number | string;
  user_id?: number | string;
  userId?: number | string;
  is_verified?: boolean | number | string;
  isVerified?: boolean | number | string;
  full_name: string;
  role_title: string;
  specialist?: string;
  clinic_id?: number;
  verified?: boolean;
}

interface PendingRequestsProps {
  pending: PendingStaffMember[];
  loading: boolean;
  onVerify: (id: number) => Promise<void>;
  verifyingId: number | null;
}

export default function PendingRequests({
  pending,
  loading,
  onVerify,
  verifyingId,
}: PendingRequestsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`skeleton-pending-${i}`}
            className="h-20 rounded-2xl bg-(--semi-card-bg) animate-pulse"
          />
        ))}
      </div>
    );
  }

  const visiblePending = pending.filter((member) => !getStaffVerified(member));

  if (visiblePending.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-14 gap-4"
        style={{ animation: "scaleIn 0.4s ease both" }}
      >
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shadow-inner">
          <BadgeCheck size={28} className="text-emerald-500" />
        </div>
        <div className="text-center">
          <p className="text-(--text-secondary) text-sm font-semibold">
            لا توجد طلبات معلقة
          </p>
          <p className="text-(--text-secondary) text-xs opacity-60 mt-1">
            جميع الأطباء موثقون بنجاح ✓
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      {visiblePending.map((member, idx) => {
        const staffId = getStaffId(member);

        return (
          <div
            key={getStaffRowKey(member, idx, "pending-staff")}
            className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl border border-amber-200/70 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-700/30 hover:shadow-[var(--shadow-soft)] transition-all duration-250"
            style={{
              animation: "slideIn 0.35s ease both",
              animationDelay: `${idx * 70}ms`,
            }}
          >
            {/* Avatar + Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 shadow-inner">
                <User size={17} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-(--text-primary) text-sm">
                  {member.full_name}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {member.role_title && (
                    <span className="flex items-center gap-1 text-xs text-(--text-secondary)">
                      <Briefcase size={11} />
                      {getStaffRoleLabel(member)}
                    </span>
                  )}
                  {member.specialist && (
                    <span className="flex items-center gap-1 text-xs text-(--text-secondary)">
                      <Stethoscope size={11} />
                      {member.specialist}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status + Action */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock size={11} />
                في الانتظار
              </span>
              <button
                onClick={() => {
                  if (staffId !== null) void onVerify(staffId);
                }}
                disabled={staffId === null || verifyingId === staffId}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-px"
              >
                {verifyingId === staffId ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    جاري...
                  </>
                ) : (
                  <>
                    <BadgeCheck size={13} />
                    قبول
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
