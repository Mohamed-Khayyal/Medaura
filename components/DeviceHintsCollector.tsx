"use client";

import { useEffect } from "react";

/**
 * DeviceHintsCollector
 *
 * Runs once on the client to fetch high-entropy User-Agent Client Hints
 * (real device model, platform, platform version) via the navigator.userAgentData API.
 * Stores the result as a JSON cookie named "x-device-hints" so that the Next.js
 * BFF server-side API client can read it and forward it to the Clynk backend
 * for accurate audit log device fingerprinting.
 */
export default function DeviceHintsCollector() {
  useEffect(() => {
    const collect = async () => {
      try {
        const uaData = (navigator as any).userAgentData;
        if (!uaData?.getHighEntropyValues) return;

        const hints = await uaData.getHighEntropyValues([
          "model",
          "platform",
          "platformVersion",
          "mobile",
          "uaFullVersion",
          "brands",
        ]);

        const payload = JSON.stringify({
          model: hints.model || "",
          platform: hints.platform || "",
          platformVersion: hints.platformVersion || "",
          mobile: hints.mobile ? "?1" : "?0",
        });

        // Store as a cookie readable server-side (no httpOnly so JS can set it)
        document.cookie = `x-device-hints=${encodeURIComponent(payload)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      } catch {
        // Not supported or user denied — silently ignore
      }
    };

    collect();
  }, []);

  return null;
}
