import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/api/admin";
import { getServerAccessToken } from "@/lib/api/server-auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAccessToken(request);
    const token = auth.token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing authorization token" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: email, password" },
        { status: 400 }
      );
    }

    const response = await adminService.createAdmin(body, token);
    return NextResponse.json({ success: true, data: response }, { status: 201 });
  } catch (error: any) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create admin" },
      { status: error.status || 500 }
    );
  }
}
