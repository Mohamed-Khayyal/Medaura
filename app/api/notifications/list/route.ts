import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/lib/api/notifications";
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

// GET /api/notifications/list
export async function GET(request: NextRequest) {
  try {
    let auth = await getServerAccessToken(request);

    if (!auth.token) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    let response;
    try {
      response = await notificationService.getMyNotifications(auth.token);
    } catch (error: unknown) {
      if (!isUnauthorized(error)) throw error;

      auth = await getServerAccessToken(request, { forceRefresh: true });
      if (!auth.token) throw error;
      response = await notificationService.getMyNotifications(auth.token);
    }

    return applyAuthCookies(
      NextResponse.json({ success: true, data: response }),
      auth
    );
  } catch (error: unknown) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to fetch notifications"),
      },
      { status: getErrorStatus(error) }
    );
  }
}
