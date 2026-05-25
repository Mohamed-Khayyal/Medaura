import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

// POST /api/auth/refresh
export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "No refresh token found in cookies",
        },
        { status: 400 }
      );
    }

    // Get raw response to capture Set-Cookie headers from backend
    const backendResponse = await apiClient.getRawResponse(
      "/api/auth/refresh",
      "POST",
      { refresh_token: refreshToken },
      {
        headers: {
          Cookie: `refresh_token=${refreshToken}`,
        },
      }
    );

    // Parse response data
    const responseData = await backendResponse.json();

    // Handle errors
    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: responseData.message || responseData.error || "Token refresh failed",
        },
        { status: backendResponse.status }
      );
    }

    const res = NextResponse.json({ success: true, data: responseData });

    // Extract Set-Cookie headers from backend response and forward them
    const setCookieHeader = backendResponse.headers.get("set-cookie");
    const backendCookies =
      backendResponse.headers.getSetCookie?.() ||
      (setCookieHeader ? [setCookieHeader] : []);
    backendCookies.forEach((cookie) => {
      res.headers.append("set-cookie", cookie);
    });

    // Also set cookies from response data as fallback
    if (responseData.access_token || responseData.token) {
      const token = responseData.access_token || responseData.token;
      if (token) {
        res.cookies.set("jwt", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
        });
      }
    }

    if (responseData.refresh_token || responseData.refreshToken) {
      const newRefreshToken = responseData.refresh_token || responseData.refreshToken;
      if (newRefreshToken) {
        res.cookies.set("refresh_token", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
        });
      }
    }

    return res;
  } catch (error: any) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Token refresh failed",
      },
      { status: error.status || 500 }
    );
  }
}
