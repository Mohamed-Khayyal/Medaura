import { NextRequest, NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/api/server-auth";
export const dynamic = "force-dynamic";
import { bookingService } from "@/lib/api/bookings";
import { apiClient } from "@/lib/api/client";
import fs from "fs";
import path from "path";
import {
  computeSummary,
  computeMonthlyRevenue,
  computeDailyRevenue,
} from "@/app/clinicDash/financial/lib/calculations";
import type {
  RawBooking,
  RawStaffMember,
  ProfitSharingStore,
  AppointmentPaymentStore,
} from "@/app/clinicDash/financial/lib/types";

const DATA_FILE      = path.join(process.cwd(), "data", "profit-sharing.json");
const APPT_DATA_FILE = path.join(process.cwd(), "data", "appointment-payments.json");

function readStore(): ProfitSharingStore {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as ProfitSharingStore;
  } catch { return {}; }
}

function readApptStore(): AppointmentPaymentStore {
  try {
    if (!fs.existsSync(APPT_DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(APPT_DATA_FILE, "utf-8")) as AppointmentPaymentStore;
  } catch { return {}; }
}

function extractList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const p = payload as Record<string, unknown>;
  for (const key of ["data", "staff", "bookings"]) {
    if (Array.isArray(p?.[key])) return p[key] as T[];
    const nested = (p?.[key] as Record<string, unknown>);
    if (Array.isArray(nested?.data)) return nested.data as T[];
  }
  return [];
}

export async function GET(request: NextRequest) {
  const auth = await getServerAccessToken(request);
  if (!auth.token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.token;

  try {
    const [bookingsRaw, staffRaw] = await Promise.all([
      bookingService.getClinicBookings(token),
      apiClient.get<unknown>("/api/staff/my-clinic", { token }),
    ]);

    const bookings  = (Array.isArray(bookingsRaw) ? bookingsRaw : []) as RawBooking[];
    const staff     = extractList<RawStaffMember>(staffRaw);
    const store     = readStore();
    
    const paymentsRes = await apiClient.get<any>("/api/payments/clinic/financials?limit=10000", { token });
    const payments = paymentsRes?.payments || [];

    // Always use Egypt local date (UTC+2/+3) so "today" matches what the admin sees.
    // Any confirmed payment counts as paid on the day the admin confirmed it in Egypt time.
    const egyptToday = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()); // gives "YYYY-MM-DD"

    const apptStore: Record<string, { status: "paid" | "cancelled"; date: string }> = {};
    for (const p of payments) {
      // Try to get the actual confirmation date from the API (various possible field names).
      // If no date field exists, stamp it with today's Egypt date — it was confirmed today.
      const rawDate: string =
        p.paid_at ?? p.confirmed_at ?? p.payment_date ?? p.updated_at ?? p.created_at ?? "";
      const payDate = rawDate ? rawDate.slice(0, 10) : egyptToday;
      apptStore[String(p.booking_id)] = { status: "paid", date: payDate };
    }

    // All summary KPIs now reflect paid appointments only
    const summary = computeSummary(bookings, staff, store, apptStore);
    const monthly = computeMonthlyRevenue(bookings, staff, apptStore, 12);
    const daily   = computeDailyRevenue(bookings, staff, apptStore, 30);

    return NextResponse.json({
      success: true,
      data: { summary, monthly, daily },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[financial/summary]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
