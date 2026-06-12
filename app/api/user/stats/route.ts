import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getErrorStatus(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as any).status === "number"
    ? (error as any).status
    : 500;
}

// GET /api/user/stats
export async function GET(request: NextRequest) {
  try {
    const response = await apiClient.get("/api/user/stats");
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Get user stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to fetch stats"),
      },
      { status: getErrorStatus(error) }
    );
  }
}
