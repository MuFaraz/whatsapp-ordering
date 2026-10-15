import type { NextConfig } from "next";

/**
 * Cache Components is intentionally left disabled: almost every route in this
 * app is either session-dependent (dashboard) or must always show the latest
 * menu (public menu), so the classic dynamic rendering model is simpler and
 * safer for the MVP.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Uploaded images are resized/compressed in the browser before upload and
    // demo images are local SVGs, so we skip Vercel image optimisation (which
    // has free-tier quotas).
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
