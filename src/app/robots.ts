import type { MetadataRoute } from "next";
import { getEnvAppUrl } from "@/lib/app-url.env";

export default function robots(): MetadataRoute.Robots {
  const base = getEnvAppUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or sandbox areas; restaurant menus stay indexable.
      disallow: ["/dashboard", "/onboarding", "/demo/dashboard", "/auth", "/reset-password"],
    },
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
