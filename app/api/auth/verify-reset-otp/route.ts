import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/api/auth";
import type { VerifyResetOtpRequest } from "@/lib/types/api";

function getStatus(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error
    ? Number((error as { status?: number }).status)
    : undefined;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

// POST /api/auth/verify-reset-otp
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyResetOtpRequest;

    if (!body.email || !body.otp) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: email, otp",
        },
        { status: 400 }
      );
    }

    const response = await authService.verifyResetOtp(body);

    return NextResponse.json({ success: true, data: response });
  } catch (error: unknown) {
    console.error("Verify reset OTP error:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to verify reset code"),
      },
      { status: getStatus(error) || 500 }
    );
  }
}
