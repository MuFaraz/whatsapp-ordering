import type { MetadataRoute } from "next";
import { getEnvAppUrl } from "@/lib/app-url.env";

/** Marketing pages only; restaurant menus are reached via their QR codes. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getEnvAppUrl();
  if (!base) return [];
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/demo`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
