import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/lib/api/bookings";
import { apiClient } from "@/lib/api/client";
import { authService } from "@/lib/api/auth";
import { getServerAccessToken } from "@/lib/api/server-auth";

// GET /api/bookings/slots?staff_id=2&booking_date=2026-02-22
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctor_id");
    const staffId = searchParams.get("staff_id");
    const bookingDate = searchParams.get("booking_date");

    if (!bookingDate || (!doctorId && !staffId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required parameters: doctor_id or staff_id, booking_date",
        },
        { status: 400 }
      );
    }

    let resolvedDoctorId = doctorId;
    let resolvedStaffId = staffId;

    if (doctorId === "me") {
      const auth = await getServerAccessToken(request);
      if (!auth.token) {
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 }
        );
      }

      // Fetch profile
      let profileRes: any;
      try {
        profileRes = await authService.getProfile(auth.token);
      } catch (err) {
        console.error("Failed to fetch profile in slots route:", err);
        return NextResponse.json(
          { success: false, error: "Failed to fetch profile" },
          { status: 500 }
        );
      }

      const userRole = profileRes?.user?.role || profileRes?.role;
      const userProfile = profileRes?.user?.profile || profileRes?.profile;

      if (userRole === "doctor") {
        const docId = userProfile?.doctor_id || userProfile?.id || userProfile?._id;
        if (!docId) {
          return NextResponse.json(
            { success: false, error: "Doctor profile ID not found" },
            { status: 404 }
          );
        }
        resolvedDoctorId = String(docId);
        resolvedStaffId = null;
      } else if (userRole === "staff") {
        const stId = userProfile?.staff_id || userProfile?.id || userProfile?._id;
        if (!stId) {
          return NextResponse.json(
            { success: false, error: "Staff profile ID not found" },
            { status: 404 }
          );
        }
        resolvedDoctorId = null;
        resolvedStaffId = String(stId);
      } else {
        return NextResponse.json(
          { success: false, error: "Unauthorized user role for slots lookup" },
          { status: 403 }
        );
      }
    }

    if (resolvedDoctorId) {
      const params = new URLSearchParams({
        doctor_id: resolvedDoctorId,
        booking_date: bookingDate,
      });
      const response = await apiClient.get(
        `/api/book/slots?${params.toString()}`
      );
      return NextResponse.json({ success: true, data: response });
    }

    const response = await bookingService.getAvailableSlots({
      staff_id: resolvedStaffId as string,
      booking_date: bookingDate,
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error: unknown) {
    console.error("Get booking slots error:", error);
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number((error as { status?: number }).status)
        : 500;
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch available slots",
      },
      { status }
    );
  }
}

