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
    const apptStore: Record<string, string> = {};
    for (const p of payments) {
      apptStore[String(p.booking_id)] = "paid";
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
