import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/api/auth";
import type { ResetPasswordRequest } from "@/lib/types/api";

type ResetPasswordParams = {
  token: string;
};

async function resolveParams(
  params: ResetPasswordParams | Promise<ResetPasswordParams>
) {
  return Promise.resolve(params);
}

function getStatus(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error
    ? Number((error as { status?: number }).status)
    : undefined;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function handleReset(
  request: NextRequest,
  params: ResetPasswordParams | Promise<ResetPasswordParams>
) {
  try {
    const { token } = await resolveParams(params);
    const body = (await request.json()) as ResetPasswordRequest;

    const confirm = body.confirmPassword || body.passwordConfirm;

    if (!token || !body.password || !confirm) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: token, password, confirmPassword",
        },
        { status: 400 }
      );
    }

    const response = await authService.resetPassword(token, {
      password: body.password,
      confirmPassword: confirm,
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error: unknown) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to reset password"),
      },
      { status: getStatus(error) || 500 }
    );
  }
}

// PATCH /api/auth/reset-password/:token
export async function PATCH(
  request: NextRequest,
  context: { params: ResetPasswordParams }
) {
  return handleReset(request, context.params);
}

// POST /api/auth/reset-password/:token
export async function POST(
  request: NextRequest,
  context: { params: ResetPasswordParams }
) {
  return handleReset(request, context.params);
}
