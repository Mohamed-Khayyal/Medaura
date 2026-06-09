import { NextRequest, NextResponse } from "next/server";
import { doctorService } from "@/lib/api/doctors";
import { applyAuthCookies, getServerAccessToken } from "@/lib/api/server-auth";

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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to fetch dashboard";
}

export async function GET(request: NextRequest) {
  let auth = await getServerAccessToken(request);

  if (!auth.token) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    let dashboardResponse;
    try {
      dashboardResponse = await doctorService.getDashboard(auth.token);
    } catch (error: unknown) {
      if (!isUnauthorized(error)) throw error;

      auth = await getServerAccessToken(request, { forceRefresh: true });

      if (!auth.token) {
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 }
        );
      }

      dashboardResponse = await doctorService.getDashboard(auth.token);
    }

    // Map dashboard to data for the frontend compatibility.
    const data = (dashboardResponse as any)?.dashboard || dashboardResponse;

    return applyAuthCookies(
      NextResponse.json({
        success: true,
        data,
      }),
      auth
    );
  } catch (error: unknown) {
    console.error("Get doctor dashboard snapshot error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
