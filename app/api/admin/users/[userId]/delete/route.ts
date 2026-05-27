import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, getServerAccessToken } from "@/lib/api/server-auth";
import { apiClient } from "@/lib/api/client";

function getUserId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  // path: /api/admin/users/[userId]/delete  → segments[-2] = userId
  const idx = segments.indexOf("users");
  return idx !== -1 ? (segments[idx + 1] ?? null) : null;
}

// DELETE /api/admin/users/[userId]/delete  → deactivates / soft-deletes user
export async function DELETE(request: NextRequest) {
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
    const res = await apiClient.delete<unknown>(
      `/api/admin/users/${userId}`,
      { token: auth.token }
    );

    return applyAuthCookies(
      NextResponse.json({ success: true, data: res }),
      auth
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status?: number }).status === "number"
        ? (error as { status: number }).status
        : 500;

    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
