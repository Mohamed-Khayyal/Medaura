import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/lib/api/bookings";
import { applyAuthCookies, getServerAccessToken } from "@/lib/api/server-auth";

function getStatus(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error
    ? Number((error as { status?: number }).status)
    : undefined;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function PATCH(request: NextRequest) {
  try {
    let auth = await getServerAccessToken(request);
    let token = auth.token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const segments = request.nextUrl.pathname.split("/").filter(Boolean);
    // Path structure: /api/book/[bookingId]/status
    // segments: ["api", "book", "[bookingId]", "status"]
    const bookingId = segments[segments.length - 2];

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Missing booking ID" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { status } = body;
    if (!status) {
      return NextResponse.json(
        { success: false, error: "Missing status field" },
        { status: 400 }
      );
    }

    let response;
    try {
      response = await bookingService.updateBookingStatus(bookingId, status, token);
    } catch (error: unknown) {
      if (getStatus(error) !== 401) throw error;
      auth = await getServerAccessToken(request, { forceRefresh: true });
      token = auth.token;
      if (!token) throw error;
      response = await bookingService.updateBookingStatus(bookingId, status, token);
    }

    const nextResponse = NextResponse.json({ success: true, data: response });
    return applyAuthCookies(nextResponse, auth);
  } catch (error: any) {
    console.error("Update booking status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to update booking status"),
      },
      { status: getStatus(error) || 500 }
    );
  }
}
