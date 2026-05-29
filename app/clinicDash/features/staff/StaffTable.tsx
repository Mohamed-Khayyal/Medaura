"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CheckCircle,
  CircleOff,
  Clock,
  Mail,
  Stethoscope,
  User,
  UserCheck,
} from "lucide-react";
import {
  getStaffId,
  getStaffRoleLabel,
  getStaffRowKey,
  getStaffVerified,
} from "./staffIdentity";

export interface StaffMember {
  id?: number;
  staff_id?: number | string;
  staffId?: number | string;
  user_id?: number | string;
  userId?: number | string;
  is_verified?: boolean | number | string;
  isVerified?: boolean | number | string;
  is_active?: boolean | number | string;
  isActive?: boolean | number | string;
  active?: boolean | number | string;
  email?: string;
  full_name: string;
  role_title: string;
  specialist?: string;
  work_days?: string;
  work_from?: string;
  work_to?: string;
  consultation_price?: number;
  verified?: boolean;
  photo?: string | null;
}

interface StaffTableProps {
  staff: StaffMember[];
  loading: boolean;
  onVerify: (id: number) => Promise<void>;
}

function toBooleanFlag(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "active"].includes(normalized)) return true;
    if (["false", "0", "no", "inactive"].includes(normalized)) return false;
  }

  return null;
}

function getActiveStatus(member: StaffMember) {
  return toBooleanFlag(member.is_active ?? member.isActive ?? member.active);
}

export default function StaffTable({ staff, loading, onVerify }: StaffTableProps) {
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const handleVerify = async (id: number) => {
    setVerifyingId(id);
    try {
      await onVerify(id);
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`skeleton-row-${i}`}
            className="h-16 rounded-xl bg-(--semi-card-bg) animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-16 h-16 rounded-full bg-(--semi-card-bg) flex items-center justify-center">
          <User size={28} className="text-(--text-secondary)" />
        </div>
        <p className="text-(--text-secondary) text-sm">لا يوجد أطباء في العيادة بعد</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm" dir="rtl">
        <thead>
          <tr className="border-b border-(--card-border)">
            {["الطبيب", "البريد الإلكتروني", "الدور", "التخصص", "أيام العمل", "التوثيق", "الحساب", "إجراء"].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-right text-xs font-semibold text-(--text-secondary) uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-(--card-border)">
          {staff.map((member, idx) => {
            const staffId = getStaffId(member);
            const verified = getStaffVerified(member);
            const active = getActiveStatus(member);

            return (
              <tr
                key={getStaffRowKey(member, idx, "staff-row")}
                className="group hover:bg-(--semi-card-bg) transition-colors duration-150"
              >
              {/* Name */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User size={15} className="text-teal-600" />
                    )}
                  </div>
                  <span className="font-medium text-(--text-primary)">
                    {member.full_name}
                  </span>
                </div>
              </td>

              {/* Email */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                {member.email ? (
                  <div className="flex items-center gap-1.5 text-(--text-secondary)" dir="ltr">
                    <Mail size={13} />
                    <span>{member.email}</span>
                  </div>
                ) : (
                  <span className="text-(--text-secondary)">—</span>
                )}
              </td>

              {/* Role */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-(--text-secondary)">
                  <UserCheck size={13} />
                  <span>{getStaffRoleLabel(member)}</span>
                </div>
              </td>

              {/* Specialist */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-(--text-secondary)">
                  <Stethoscope size={13} />
                  <span>{member.specialist || "—"}</span>
                </div>
              </td>

              {/* Work days */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                {member.work_days ? (
                  <div className="flex items-center gap-1.5 text-(--text-secondary)">
                    <Clock size={13} />
                    <span>{member.work_days}</span>
                  </div>
                ) : (
                  <span className="text-(--text-secondary)">—</span>
                )}
              </td>

              {/* Status */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                {verified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle size={12} />
                    موثق
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Clock size={12} />
                    في الانتظار
                  </span>
                )}
              </td>

              {/* Account */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                {active === null ? (
                  <span className="text-(--text-secondary)">—</span>
                ) : active ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                    <CheckCircle size={12} />
                    نشط
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <CircleOff size={12} />
                    غير نشط
                  </span>
                )}
              </td>

              {/* Action */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                {!verified ? (
                  <button
                    onClick={() => {
                      if (staffId !== null) void handleVerify(staffId);
                    }}
                    disabled={staffId === null || verifyingId === staffId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-px"
                  >
                    {verifyingId === staffId ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        جاري...
                      </>
                    ) : (
                      <>
                        <BadgeCheck size={13} />
                        توثيق
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-(--text-secondary) px-3 py-1.5">موثق بالفعل</span>
                )}
              </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
