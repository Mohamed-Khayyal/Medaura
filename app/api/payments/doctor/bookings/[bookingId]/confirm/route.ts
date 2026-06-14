import { NextRequest, NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/api/server-auth";
import { apiClient } from "@/lib/api/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const auth = await getServerAccessToken(request);
  if (!auth.token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  const { bookingId } = await params;

  try {
    const meRes = await apiClient.get<any>("/api/user/me", { token: auth.token });
    const role = meRes?.user?.role?.toLowerCase();
    
    const endpoint = role === "staff"
      ? `/api/payments/staff/bookings/${bookingId}/confirm`
      : `/api/payments/doctor/bookings/${bookingId}/confirm`;

    const data = await apiClient.post<any>(
      endpoint,
      {},
      { token: auth.token }
    );
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[payments/doctor/confirm]", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    );
  }
}
