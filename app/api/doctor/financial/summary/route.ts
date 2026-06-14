import { NextRequest, NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/api/server-auth";
import { bookingService } from "@/lib/api/bookings";
import { apiClient } from "@/lib/api/client";
import fs from "fs";
import path from "path";
import {
  isCompleted,
  getApptPaymentStatus,
  todayStr,
  currentMonthStr,
  currentYearStr,
} from "@/app/clinicDash/financial/lib/calculations";

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

    // 2. Fetch bookings for this provider
    const bookingsRaw = await bookingService.getMyBookings(token);
    const bookings = (Array.isArray(bookingsRaw) ? bookingsRaw : []) as any[];

    // 3. Load configurations & payment states
    const store = readStore();
    
    // Fetch real payment records from Clynk backend
    const isStaff = user?.role?.toLowerCase() === "staff";
    const endpoint = isStaff ? "/api/payments/staff/financials?limit=10000" : "/api/payments/doctor/financials?limit=10000";
    const paymentsRes = await apiClient.get<any>(endpoint, { token });
    const payments = paymentsRes?.payments || [];
    const apptStore: Record<string, string> = {};
    for (const p of payments) {
      apptStore[String(p.booking_id)] = "paid";
    }

    const config = store[String(providerId)] ?? { doctorPercentage: 70 };
    const docPct = isStaff ? 80 : config.doctorPercentage;
    const clinicPct = 100 - docPct;

    const today = todayStr();
    const monthStr = currentMonthStr();
    const yearStr = currentYearStr();

    let todayRevenue = 0;
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;
    let clinicProfit = 0;
    let doctorsTotalEarnings = 0;
    let pendingPayments = 0;

    for (const b of bookings) {
      // Check if completed using the same status logic
      // In getMyBookings, booking has booking_date and status
      const bookingStatus = (b.status ?? "").toLowerCase().trim();
      const isBookingCompleted =
        bookingStatus === "completed" ||
        bookingStatus === "confirmed" ||
        bookingStatus === "done"      ||
        bookingStatus === "finished"  ||
        bookingStatus === "attended"  ||
        bookingStatus === "approved";

      if (!isBookingCompleted) continue;

      const paymentStatus = apptStore[String(b.booking_id)] ?? "pending";
      if (paymentStatus === "cancelled") continue;

      const date = b.booking_date ?? "";
      const fee = consultationFee;

      const docShare = (fee * docPct) / 100;
      const clinicShare = (fee * clinicPct) / 100;

      // KPIs reflect doctor's share
      if (date === today) {
        todayRevenue += docShare;
      }
      if (date.startsWith(monthStr)) {
        monthlyRevenue += docShare;
      }
      if (date.startsWith(yearStr)) {
        yearlyRevenue += docShare;
        doctorsTotalEarnings += docShare;
        clinicProfit += clinicShare;
      }

      if (paymentStatus === "pending") {
        pendingPayments += docShare;
      }
    }

    // 4. Compute Daily and Monthly charts data
    // Daily chart (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30 + 1);

    const dailyMap = new Map<string, number>();
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dailyMap.set(d.toISOString().slice(0, 10), 0);
    }

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

      const paymentStatus = apptStore[String(b.booking_id)] ?? "pending";
      if (paymentStatus === "cancelled") continue;

      const date = b.booking_date ?? "";
      if (dailyMap.has(date)) {
        const docShare = (consultationFee * docPct) / 100;
        dailyMap.set(date, (dailyMap.get(date) ?? 0) + docShare);
      }
    }
    const daily = Array.from(dailyMap.entries()).map(([date, revenue]) => ({ date, revenue }));

    // Monthly chart (last 12 months)
    const ARABIC_MONTHS = [
      "يناير","فبراير","مارس","أبريل","مايو","يونيو",
      "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
    ];
    const monthlyList: any[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyList.push({ month: key, label: `${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`, revenue: 0 });
    }
    const monthlyMap = new Map(monthlyList.map((r) => [r.month, r]));

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

      const paymentStatus = apptStore[String(b.booking_id)] ?? "pending";
      if (paymentStatus === "cancelled") continue;

      const month = (b.booking_date ?? "").slice(0, 7);
      const entry = monthlyMap.get(month);
      if (entry) {
        const docShare = (consultationFee * docPct) / 100;
        entry.revenue += docShare;
      }
    }

    const summary = {
      todayRevenue,
      monthlyRevenue,
      yearlyRevenue,
      clinicProfit,
      doctorsTotalEarnings,
      pendingPayments,
    };

    return NextResponse.json({
      success: true,
      data: { summary, monthly: monthlyList, daily },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[doctor/financial/summary]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
