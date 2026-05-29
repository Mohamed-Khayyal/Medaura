import { NextRequest, NextResponse } from "next/server";
import { staffService } from "@/lib/api/staff";
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

// POST /api/staff/create
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAccessToken(request);

    if (!auth.token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized – please log in" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const email = String(body.email ?? "").trim();
    const fullName = String(body.full_name ?? "").trim();
    const specialist = String(body.specialist ?? "").trim();

    if (!email || !body.password || !fullName || !specialist) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: email, password, full_name, specialist",
        },
        { status: 400 }
      );
    }

    const payload = {
      ...body,
      email,
      full_name: fullName,
      specialist,
      role_title: "doctor",
    };

    const data = await staffService.createStaff(payload, auth.token);
    const res = NextResponse.json({ success: true, data }, { status: 201 });
    return applyAuthCookies(res, auth);
  } catch (error: unknown) {
    console.error("Create staff error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, "Failed to create staff") },
      { status: getErrorStatus(error) }
    );
  }
}
