import { NextRequest, NextResponse } from "next/server";
import { doctorService } from "@/lib/api/doctors";

// GET /api/doctors/best?limit=3
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 3;

    const response = await doctorService.getBest();
    
    let doctors: any[] = [];
    if (Array.isArray(response)) {
      doctors = response;
    } else if (response && Array.isArray((response as any).doctors)) {
      doctors = (response as any).doctors;
    } else if (response && (response as any).data && Array.isArray((response as any).data.doctors)) {
      doctors = (response as any).data.doctors;
    } else if (response && (response as any).data && Array.isArray((response as any).data)) {
      doctors = (response as any).data;
    }

    // Slice to the requested limit
    const slicedDoctors = doctors.slice(0, limit);

    return NextResponse.json({
      success: true,
      doctors: slicedDoctors,
      data: {
        doctors: slicedDoctors
      }
    });
  } catch (error: any) {
    console.error("Get best doctors error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch best doctors",
      },
      { status: error.status || 500 }
    );
  }
}
