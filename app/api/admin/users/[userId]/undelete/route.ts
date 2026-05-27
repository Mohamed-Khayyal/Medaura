import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, getServerAccessToken } from "@/lib/api/server-auth";
import { apiClient } from "@/lib/api/client";

function getUserId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const idx = segments.indexOf("users");
  return idx !== -1 ? (segments[idx + 1] ?? null) : null;
}

// PATCH /api/admin/users/[userId]/undelete  → reactivates user
export async function PATCH(request: NextRequest) {
  const auth = await getServerAccessToken(request);

  if (!auth.token) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const userId = getUserId(request);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Missing user ID" },
      { status: 400 }
    );
  }

  try {
    const res = await apiClient.patch<unknown>(
      `/api/admin/users/${userId}/undelete`,
      undefined,
      { token: auth.token }
    );

    return applyAuthCookies(
      NextResponse.json({ success: true, data: res }),
      auth
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to reactivate user";
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status?: number }).status === "number"
        ? (error as { status: number }).status
        : 500;

    console.error("Undelete user error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
