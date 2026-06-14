import { NextRequest, NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/api/server-auth";
import { apiClient } from "@/lib/api/client";

export async function POST(request: NextRequest) {
  const auth = await getServerAccessToken(request);
  if (!auth.token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await apiClient.post<any>("/api/payments/seed-financials", {}, { token: auth.token });
    return NextResponse.json({ success: true, data: res });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[financial/seed]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
