import { NextRequest, NextResponse } from "next/server";

type IpApiResponse = {
  status?: string;
  country?: string;
  regionName?: string;
  city?: string;
  lat?: number;
  lon?: number;
  query?: string;
  message?: string;
};

function normalizeIp(ip: string | null) {
  if (!ip) return null;
  const firstIp = ip.split(",")[0]?.trim();
  if (!firstIp) return null;
  return firstIp.replace(/^::ffff:/, "");
}

function isPrivateIp(ip: string | null) {
  if (!ip) return true;
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    /^10\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^192\.168\./.test(ip)
  );
}

function getRequestIp(request: NextRequest) {
  return normalizeIp(
    request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip")
  );
}

export async function GET(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const ipPath = isPrivateIp(ip) ? "" : `/${encodeURIComponent(ip!)}`;
    const url = `https://ipinfo.io${ipPath}/json`;

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to resolve location" },
        { status: 502 }
      );
    }

    const data = await response.json();
    if (data.error) {
      return NextResponse.json(
        {
          success: false,
          error: data.error.message || "Location is unavailable",
        },
        { status: 404 }
      );
    }

    let latitude: number | null = null;
    let longitude: number | null = null;
    if (data.loc) {
      const parts = data.loc.split(",");
      latitude = parseFloat(parts[0]);
      longitude = parseFloat(parts[1]);
    }

    return NextResponse.json({
      success: true,
      data: {
        ip: data.ip || ip,
        city: data.city || null,
        region: data.region || null,
        country: data.country || null,
        latitude,
        longitude,
        map_url:
          latitude !== null && longitude !== null
            ? `https://www.google.com/maps?q=${latitude},${longitude}`
            : null,
        source: "ipinfo",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to resolve location" },
      { status: 500 }
    );
  }
}
