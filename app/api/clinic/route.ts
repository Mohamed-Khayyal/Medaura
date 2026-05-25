import { NextRequest, NextResponse } from "next/server";
import { clinicService } from "@/lib/api/clinic";

export async function GET(request: NextRequest) {
  try {
    const response = await clinicService.list();

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error: any) {
    console.error("GET /api/clinic error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch clinics",
      },
      { status: error.status || 500 }
    );
  }
}
