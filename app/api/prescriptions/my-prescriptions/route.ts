import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:3001";

// GET /api/prescriptions/my-prescriptions
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("jwt")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/prescriptions/my-prescriptions`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to fetch prescriptions" },
        { status: response.status },
      );
    }

    // Clynk returns { status, results, prescriptions }
    const prescriptions = data.prescriptions || data.data || data;
    const list = Array.isArray(prescriptions) ? prescriptions : [];

    return NextResponse.json({ success: true, data: list });
  } catch (error: unknown) {
    console.error("Get my prescriptions error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch prescriptions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
