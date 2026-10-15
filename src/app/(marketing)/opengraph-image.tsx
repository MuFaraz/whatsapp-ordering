import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

/** Link preview for the marketing pages (e.g. when the URL is shared on WhatsApp). */
export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #7a2e10 0%, #b4471a 55%, #e07a2e 100%)",
          color: "#fff8ef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#ffe2bc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7a2e10",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            B
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, maxWidth: 960 }}>
            Your menu on every table. Orders straight to WhatsApp.
          </div>
          <div style={{ fontSize: 32, opacity: 0.9 }}>
            QR menus for restaurants · No app · No commission
          </div>
        </div>
      </div>
    ),
    size,
  );
}
