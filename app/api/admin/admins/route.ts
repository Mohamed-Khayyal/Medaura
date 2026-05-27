import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, getServerAccessToken } from "@/lib/api/server-auth";
import { apiClient } from "@/lib/api/client";

export async function GET(request: NextRequest) {
  const auth = await getServerAccessToken(request);

  if (!auth.token) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const res = await apiClient.get<unknown>("/api/admin/admins", {
      token: auth.token,
    });

    return applyAuthCookies(
      NextResponse.json({ success: true, data: res }),
      auth
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch admins";
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status?: number }).status === "number"
        ? (error as { status: number }).status
        : 500;

    console.error("List admins error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
