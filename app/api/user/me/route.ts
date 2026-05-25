import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/api/auth";
import { applyAuthCookies, getServerAccessToken } from "@/lib/api/server-auth";

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

function isUnauthorized(error: unknown) {
  return getErrorStatus(error) === 401;
}

// GET /api/user/me
export async function GET(request: NextRequest) {
  try {
    let auth = await getServerAccessToken(request);

    if (!auth.token) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    let response;
    try {
      response = await authService.getProfile(auth.token);
    } catch (error: unknown) {
      if (!isUnauthorized(error)) throw error;

      auth = await getServerAccessToken(request, { forceRefresh: true });
      if (!auth.token) throw error;
      response = await authService.getProfile(auth.token);
    }

    return applyAuthCookies(
      NextResponse.json({ success: true, data: response }),
      auth
    );
  } catch (error: unknown) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to fetch profile"),
      },
      { status: getErrorStatus(error) }
    );
  }
}

// PATCH /api/user/me
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    let auth = await getServerAccessToken(request);
    const token = auth.token || authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let body: any;
    const customHeaders: Record<string, string> = {};

    try {
      if (contentType.includes("multipart/form-data")) {
        body = new Blob([await request.arrayBuffer()]);
        customHeaders["content-type"] = contentType;
      } else if (contentType.includes("application/json")) {
        body = await request.json();
      } else {
        try {
          body = await request.json();
        } catch {
          body = {};
        }
      }
    } catch {
      body = {};
    }

    let response;

    try {
      response = await authService.updateProfile(token, body, {
        headers: customHeaders,
      });
    } catch (error: unknown) {
      if (!isUnauthorized(error)) throw error;

      auth = await getServerAccessToken(request, {
        forceRefresh: true,
      });

      if (!auth.token) throw error;

      response = await authService.updateProfile(
        auth.token,
        body,
        {
          headers: customHeaders,
        }
      );
    }

    return applyAuthCookies(
      NextResponse.json({
        success: true,
        data: response,
      }),
      auth
    );
  } catch (error: unknown) {
    console.error("Update profile error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(
          error,
          "Failed to update profile"
        ),
      },
      {
        status: getErrorStatus(error),
      }
    );
  }
}
