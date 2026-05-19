import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/api/auth";
import type { ForgotPasswordRequest } from "@/lib/types/api";

function getStatus(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error
    ? Number((error as { status?: number }).status)
    : undefined;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

// POST /api/auth/forgot-password
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ForgotPasswordRequest;

    if (!body.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: email",
        },
        { status: 400 }
      );
    }

    const response = await authService.forgotPassword(body);

    return NextResponse.json({ success: true, data: response });
  } catch (error: unknown) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to send reset code"),
      },
      { status: getStatus(error) || 500 }
    );
  }
}
