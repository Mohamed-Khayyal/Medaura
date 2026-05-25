import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/api/admin";
import { applyAuthCookies, getServerAccessToken } from "@/lib/api/server-auth";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getErrorStatus(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
    ? error.status
    : 500;
}

function isUnauthorized(error: unknown) {
  return getErrorStatus(error) === 401;
}

export async function GET(request: NextRequest) {
  try {
    let auth = await getServerAccessToken(request);

    if (!auth.token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    let stats;
    try {
      stats = await adminService.getAuditStats(auth.token);
    } catch (error: unknown) {
      if (!isUnauthorized(error)) throw error;

      auth = await getServerAccessToken(request, { forceRefresh: true });
      if (!auth.token) throw error;
      stats = await adminService.getAuditStats(auth.token);
    }

    return applyAuthCookies(
      NextResponse.json({ success: true, data: stats }),
      auth
    );
  } catch (error: unknown) {
    console.error("Get audit stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to fetch audit stats"),
      },
      { status: getErrorStatus(error) }
    );
  }
}
