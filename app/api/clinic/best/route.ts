import { NextRequest, NextResponse } from "next/server";
import { clinicService } from "@/lib/api/clinic";

// GET /api/clinic/best?limit=5
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 5;

    const response = await clinicService.getBest();

    let clinics: any[] = [];
    if (Array.isArray(response)) {
      clinics = response;
    } else if (response && Array.isArray((response as any).clinics)) {
      clinics = (response as any).clinics;
    } else if (
      response &&
      (response as any).data &&
      Array.isArray((response as any).data.clinics)
    ) {
      clinics = (response as any).data.clinics;
    } else if (response && (response as any).data && Array.isArray((response as any).data)) {
      clinics = (response as any).data;
    }

    const slicedClinics = clinics.slice(0, limit);

    return NextResponse.json({
      success: true,
      clinics: slicedClinics,
      data: {
        clinics: slicedClinics,
      },
    });
  } catch (error: any) {
    console.error("Get best clinics error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch best clinics",
      },
      { status: error.status || 500 }
    );
  }
}
