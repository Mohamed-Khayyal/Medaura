import { NextRequest, NextResponse } from "next/server";
import { doctorService } from "@/lib/api/doctors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialist = searchParams.get("specialist");
    const clinicId = searchParams.get("clinic_id");
    const limit = searchParams.get("limit");

    const query = {
      specialist: specialist || undefined,
      clinic_id: clinicId ? clinicId : undefined,
      limit: limit ? parseInt(limit) : undefined,
    };

    const response = await doctorService.list(query);

    // Normalize doctors array: ensure every entry has an `id` field for the frontend
    const rawDoctors: any[] = Array.isArray((response as any).doctors)
      ? (response as any).doctors
      : Array.isArray(response)
      ? response
      : [];

    const doctors = rawDoctors.map((d: any) => ({
      ...d,
      id: d.id ?? d.doctor_id ?? d.staff_id,
    }));

    return NextResponse.json({
      success: true,
      results: doctors.length,
      doctors,
    });
  } catch (error: any) {
    console.error("GET /api/doctors error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch doctors",
      },
      { status: error.status || 500 }
    );
  }
}
