import { NextRequest, NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/api/server-auth";
import { bookingService } from "@/lib/api/bookings";
import { apiClient } from "@/lib/api/client";
import fs from "fs";
import path from "path";

const APPT_DATA_FILE = path.join(process.cwd(), "data", "appointment-payments.json");

function readApptStore() {
  try {
    if (!fs.existsSync(APPT_DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(APPT_DATA_FILE, "utf-8"));
  } catch { return {}; }
}

export async function POST(request: NextRequest) {
  const auth = await getServerAccessToken(request);
  if (!auth.token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.token;

  try {
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ success: false, error: "bookingId is required" }, { status: 400 });
    }

    // 1. Get logged-in user profile to verify role
    const meRes = await apiClient.get<any>("/api/user/me", { token });
    const user = meRes?.user;
    const profile = user?.profile;

    if (!profile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    const isDoctor = !!profile.doctor_id;
    const isStaff = !!profile.staff_id;

    if (!isDoctor && !isStaff) {
      return NextResponse.json({ success: false, error: "Access denied. Only doctors and staff can perform this action." }, { status: 403 });
    }

    // 2. Validate that the booking belongs to this user/clinic
    let belongs = false;

    if (isDoctor) {
      const bookings = await bookingService.getMyBookings(token);
      belongs = bookings.some((b: any) => String(b.booking_id) === String(bookingId));
    } else if (isStaff) {
      // Staff can check their own bookings or clinic bookings
      const myBookings = await bookingService.getMyBookings(token);
      let clinicBookings: any[] = [];
      try {
        clinicBookings = await bookingService.getClinicBookings(token);
      } catch (e) {
        console.error("Failed to fetch clinic bookings", e);
      }
      
      belongs = myBookings.some((b: any) => String(b.booking_id) === String(bookingId)) ||
                clinicBookings.some((b: any) => String(b.booking_id) === String(bookingId));
    }

    if (!belongs) {
      return NextResponse.json({ success: false, error: "Booking not found or access denied" }, { status: 404 });
    }

    // 3. Mark as paid
    const apptStore = readApptStore();
    apptStore[String(bookingId)] = "paid";

    // Ensure data directory exists
    const dir = path.dirname(APPT_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(APPT_DATA_FILE, JSON.stringify(apptStore, null, 2));

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[doctor/financial/accept]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
