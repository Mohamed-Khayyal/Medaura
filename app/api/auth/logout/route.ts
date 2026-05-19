import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/api/auth";

// POST /api/auth/logout
export async function POST(request: NextRequest) {
  let logoutError: unknown;

  try {
    const authHeader = request.headers.get("authorization");
    const headerToken = authHeader?.replace("Bearer ", "");
    const cookieToken =
      request.cookies.get("jwt")?.value ||
      request.cookies.get("access_token")?.value ||
      request.cookies.get("access")?.value ||
      request.cookies.get("accessToken")?.value ||
      request.cookies.get("token")?.value;

    const token = headerToken || cookieToken;

    if (token) {
      await authService.logout({ token });
    }
  } catch (error: unknown) {
    logoutError = error;
    console.error("Logout error:", error);
  }

  const res = NextResponse.json({
    success: true,
    message: logoutError ? "Logged out locally" : "Logged out successfully",
  });

  // Clear cookies even if backend logout fails
  res.cookies.set("jwt", "", { maxAge: 0, path: "/" });
  res.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });

  return res;
}
