import type { AuthResponse } from "@/lib/types/api";

/**
 * Returns true if the user's account is pending approval and should be
 * blocked from accessing their dashboard.
 *
 * - staff / doctor  → need `profile.verified === true`
 * - clinic          → need `profile.status === "active"` or `profile.verified === true`
 */
export function isUserPendingApproval(user: AuthResponse | null): boolean {
  if (!user) return false;

  const role = user.user_type?.toLowerCase();
  const profile = user.profile as Record<string, unknown> | undefined;

  const isVerified = profile?.is_verified === true || profile?.verified === true;

  if (role === "staff" || role === "doctor") {
    return !isVerified;
  }

  if (role === "clinic") {
    const status = profile?.status as string | undefined;
    const isActive = status === "active" || status === "approved";
    return !isActive && !isVerified;
  }

  return false;
}

/**
 * Get the appropriate dashboard path based on user role/type.
 * Unverified staff, doctors, and clinics are sent to /pending.
 */
export function getDashboardPathByUserType(
  userType: string | undefined,
  profile?: Record<string, unknown>
): string {
  if (!userType) return "/";

  const type = userType.toLowerCase();
  const isVerified = profile?.is_verified === true || profile?.verified === true;

  // Check verification for roles that require it
  if (type === "staff" || type === "doctor") {
    if (!isVerified) return "/pending";
    return "/doctorDash";
  }

  if (type === "clinic") {
    const status = profile?.status as string | undefined;
    const isActive = status === "active" || status === "approved";
    if (!isActive && !isVerified) return "/pending";
    return "/clinicDash";
  }

  switch (type) {
    case "admin":
      return "/dashboard";
    case "patient":
    default:
      return "/";
  }
}
