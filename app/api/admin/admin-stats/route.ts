import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/api/admin";
import { getServerAccessToken, applyAuthCookies } from "@/lib/api/server-auth";

// GET /api/admin/admin-stats
export async function GET(request: NextRequest) {
  let auth = await getServerAccessToken(request);

  if (!auth.token) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const response = await adminService.getDashboardStats(auth.token);

    return applyAuthCookies(
      NextResponse.json({
        success: true,
        status: "success",
        data: response,
      }),
      auth
    );
  } catch (error: any) {
    console.error("Admin stats error:", error);

    if (error.status === 401) {
      auth = await getServerAccessToken(request, { forceRefresh: true });
    }

    return NextResponse.json(
      {
        success: false,
        status: "fail",
        error: error.message || "Failed to fetch admin stats",
      },
      { status: error.status || 500 }
    );
  }
}
