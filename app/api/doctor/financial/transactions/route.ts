import { NextRequest, NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/api/server-auth";
import { bookingService } from "@/lib/api/bookings";
import { apiClient } from "@/lib/api/client";
import fs from "fs";
import path from "path";

const DATA_FILE      = path.join(process.cwd(), "data", "profit-sharing.json");
const APPT_DATA_FILE = path.join(process.cwd(), "data", "appointment-payments.json");

function readStore() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch { return {}; }
}

function readApptStore() {
  try {
    if (!fs.existsSync(APPT_DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(APPT_DATA_FILE, "utf-8"));
  } catch { return {}; }
}

export async function GET(request: NextRequest) {
  const auth = await getServerAccessToken(request);
  if (!auth.token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.token;

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const period = searchParams.get("period") ?? "";

  try {
    // 1. Get logged-in user profile
    const meRes = await apiClient.get<any>("/api/user/me", { token });
    const user = meRes?.user;
    const profile = user?.profile;

    if (!profile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    const providerId = profile.doctor_id || profile.staff_id;
    if (!providerId) {
      return NextResponse.json({ success: false, error: "Not a doctor or staff member" }, { status: 400 });
    }

    const consultationFee = Number(profile.consultation_price) || 0;
    const fullName = profile.full_name || "Doctor";
    const specialist = profile.specialist || "General";

    // 2. Fetch bookings for this provider
    const bookingsRaw = await bookingService.getMyBookings(token);
    const bookings = (Array.isArray(bookingsRaw) ? bookingsRaw : []) as any[];

    // 3. Load configurations & payment states
    const store = readStore();
    const apptStore = readApptStore();

    const config = store[String(providerId)] ?? { doctorPercentage: 70, paid: [] };
    const docPct = config.doctorPercentage;
    const clinicPct = 100 - docPct;

    // 4. Compute filtered appointment records
    const appointmentRecords: any[] = [];
    let paidCompletedCount = 0;

    for (const b of bookings) {
      const bookingStatus = (b.status ?? "").toLowerCase().trim();
      const isBookingCompleted =
        bookingStatus === "completed" ||
        bookingStatus === "confirmed" ||
        bookingStatus === "done"      ||
        bookingStatus === "finished"  ||
        bookingStatus === "attended"  ||
        bookingStatus === "approved";

      if (!isBookingCompleted) continue;

      const date = b.booking_date ?? "";
      if (dateFrom && date < dateFrom) continue;
      if (dateTo && date > dateTo) continue;

      const paymentStatus = apptStore[String(b.booking_id)] ?? "pending";

      const docShare = paymentStatus !== "cancelled" ? (consultationFee * docPct) / 100 : 0;
      const clinicShare = paymentStatus !== "cancelled" ? (consultationFee * clinicPct) / 100 : 0;

      if (paymentStatus === "paid") {
        paidCompletedCount++;
      }

      appointmentRecords.push({
        bookingId: b.booking_id,
        doctorId: providerId,
        doctorName: fullName,
        specialist,
        patientName: b.patient_name ?? "—",
        bookingDate: date,
        bookingFrom: b.booking_from ?? "—",
        consultationFee,
        doctorPercentage: docPct,
        clinicPercentage: clinicPct,
        doctorShare: docShare,
        clinicShare,
        paymentStatus,
      });
    }

    // Sort by date descending
    appointmentRecords.sort((a, b) => b.bookingDate.localeCompare(a.bookingDate));

    // Aggregate doctor records
    const totalPaidRevenue = paidCompletedCount * consultationFee;
    const isPaidPeriod = Array.isArray(config.paid) && config.paid.includes(period);

    const doctorRecords = [
      {
        doctorId: providerId,
        doctorName: fullName,
        specialist,
        consultationFee,
        completedAppointments: paidCompletedCount,
        totalRevenue: totalPaidRevenue,
        doctorPercentage: docPct,
        clinicPercentage: clinicPct,
        doctorShare: (totalPaidRevenue * docPct) / 100,
        clinicShare: (totalPaidRevenue * clinicPct) / 100,
        paymentStatus: isPaidPeriod ? "paid" : "pending",
      }
    ];

    // Paid-only transactions
    const transactions = appointmentRecords
      .filter((r) => r.paymentStatus === "paid")
      .map((r) => ({
        id: `txn-${r.bookingId}`,
        bookingId: r.bookingId,
        doctorId: r.doctorId,
        doctorName: r.doctorName,
        bookingDate: r.bookingDate,
        totalAmount: r.consultationFee,
        doctorPercentage: r.doctorPercentage,
        clinicPercentage: r.clinicPercentage,
        doctorShare: r.doctorShare,
        clinicShare: r.clinicShare,
        status: "completed",
      }));

    return NextResponse.json({
      success: true,
      data: {
        doctorRecords,
        appointmentRecords,
        transactions,
        specialties: [specialist],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[doctor/financial/transactions]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
