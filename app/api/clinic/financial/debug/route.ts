import { NextRequest, NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/api/server-auth";
import { bookingService } from "@/lib/api/bookings";
import { apiClient } from "@/lib/api/client";

/**
 * GET /api/clinic/financial/debug
 * Temporary endpoint to inspect raw booking & staff data.
 * Shows unique statuses, doctor IDs used, and whether staff map matches.
 */
export async function GET(request: NextRequest) {
  const auth = await getServerAccessToken(request);
  if (!auth.token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [bookingsRaw, staffRaw] = await Promise.all([
      bookingService.getClinicBookings(auth.token),
      apiClient.get<unknown>("/api/staff/my-clinic", { token: auth.token }),
    ]);

    // Normalize bookings
    const bookings = Array.isArray(bookingsRaw) ? bookingsRaw : [];

    // Normalize staff
    let staff: unknown[] = [];
    if (Array.isArray(staffRaw)) {
      staff = staffRaw;
    } else if (staffRaw && typeof staffRaw === "object") {
      const s = staffRaw as Record<string, unknown>;
      for (const key of ["data", "staff", "results", "items"]) {
        if (Array.isArray(s[key])) { staff = s[key] as unknown[]; break; }
        const nested = s[key] as Record<string, unknown>;
        if (nested && Array.isArray(nested?.data)) { staff = nested.data as unknown[]; break; }
      }
    }

    // Unique statuses in bookings
    const statuses = [...new Set(bookings.map((b: Record<string, unknown>) => b.status))];

    // Doctor IDs used in bookings
    const bookingDocIds = [...new Set(bookings.map((b: Record<string, unknown>) => b.doctor_id ?? b.staff_id))];

    // Staff IDs available
    const staffIds = staff.map((s: Record<string, unknown>) => ({
      id: s.id,
      staff_id: s.staff_id,
      user_id: s.user_id,
      name: s.full_name,
      fee: s.consultation_price,
    }));

    // Sample bookings (first 5)
    const sampleBookings = bookings.slice(0, 5).map((b: Record<string, unknown>) => ({
      id: b.id,
      doctor_id: b.doctor_id,
      staff_id: b.staff_id,
      status: b.status,
      booking_date: b.booking_date,
      created_at: b.created_at,
    }));

    return NextResponse.json({
      success: true,
      debug: {
        totalBookings: bookings.length,
        totalStaff: staff.length,
        uniqueStatuses: statuses,
        bookingDoctorIds: bookingDocIds,
        staffRecords: staffIds,
        sampleBookings,
        staffRawKeys: staffRaw && typeof staffRaw === "object" ? Object.keys(staffRaw as object) : [],
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
