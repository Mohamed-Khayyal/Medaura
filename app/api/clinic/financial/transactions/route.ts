import { NextRequest, NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/api/server-auth";
export const dynamic = "force-dynamic";
import { bookingService } from "@/lib/api/bookings";
import { apiClient } from "@/lib/api/client";
import fs from "fs";
import path from "path";
import {
  computeDoctorRecords,
  computeTransactions,
  computeAppointmentRecords,
} from "@/app/clinicDash/financial/lib/calculations";
import type {
  RawBooking,
  RawStaffMember,
  ProfitSharingStore,
  AppointmentPaymentStore,
  FinancialFilters,
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

  const { searchParams } = new URL(request.url);
  const filters: FinancialFilters = {};
  const dateFrom   = searchParams.get("date_from");
  const dateTo     = searchParams.get("date_to");
  const doctorId   = searchParams.get("doctor_id");
  const specialist = searchParams.get("specialist");
  const period     = searchParams.get("period") ?? undefined;

  if (dateFrom)   filters.dateFrom   = dateFrom;
  if (dateTo)     filters.dateTo     = dateTo;
  if (doctorId)   filters.doctorId   = doctorId;
  if (specialist) filters.specialist = specialist;

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

    // Doctor-level aggregates (paid appointments only) — used by charts & export
    const doctorRecords = computeDoctorRecords(bookings, staff, store, apptStore, filters, period);

    // Per-appointment rows (all statuses) — drives the earnings table
    const appointmentRecords = computeAppointmentRecords(bookings, staff, store, apptStore, filters);

    // Transaction log (paid only)
    const transactions = computeTransactions(bookings, staff, store, apptStore, filters);

    const specialties = [...new Set(staff.map((s) => s.specialist).filter(Boolean))];

    return NextResponse.json({
      success: true,
      data: { doctorRecords, appointmentRecords, transactions, specialties },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[financial/transactions]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
