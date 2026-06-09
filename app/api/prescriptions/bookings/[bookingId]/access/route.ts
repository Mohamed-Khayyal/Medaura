import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:3001";

export async function PATCH(request: NextRequest) {
  try {
    const token =
      request.cookies.get("jwt")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const segments = request.nextUrl.pathname.split("/").filter(Boolean);
    const bookingId = segments[segments.length - 2];

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Missing booking ID" },
        { status: 400 },
      );
    }

    const body = await request.json();

    if (!body.action) {
      return NextResponse.json(
        { success: false, error: "Missing action field" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/prescriptions/bookings/${bookingId}/access`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to respond to access" },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("Respond prescription access error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to respond access";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
