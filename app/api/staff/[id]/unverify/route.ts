import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";
import { getServerAccessToken, applyAuthCookies } from "@/lib/api/server-auth";

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

// PATCH /api/staff/[id]/unverify
// Tries the admin unverify endpoint — the backend only exposes this via admin routes.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getServerAccessToken(request);

    if (!auth.token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized – please log in" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const staffId = parseInt(id, 10);

    if (isNaN(staffId)) {
      return NextResponse.json(
        { success: false, error: "Invalid staff ID" },
        { status: 400 }
      );
    }

    // Try candidate endpoints — backend may expose this under admin or staff routes
    const candidates = [
      `/api/admin/${staffId}/unverify`,
      `/api/staff/${staffId}/unverify`,
      `/api/admin/staff/${staffId}/unverify`,
    ];

    let lastError: unknown;
    for (const endpoint of candidates) {
      try {
        const data = await apiClient.patch<unknown>(endpoint, undefined, {
          token: auth.token,
        });
        const res = NextResponse.json({ success: true, data });
        return applyAuthCookies(res, auth);
      } catch (err: unknown) {
        const status =
          typeof err === "object" && err !== null && "status" in err
            ? (err as { status: number }).status
            : 500;
        if (status !== 404 && status !== 405) throw err;
        lastError = err;
      }
    }

    throw lastError;
  } catch (error: unknown) {
    console.error("Unverify staff error:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to unverify staff"),
      },
      { status: getErrorStatus(error) }
    );
  }
}
