import "server-only";

import { headers } from "next/headers";
import { resolveAppUrl } from "@/lib/app-url";

async function getRequestOrigin(): Promise<string | undefined> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (!host) return undefined;
    const proto =
      h.get("x-forwarded-proto") ??
      (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return undefined;
  }
}

/** Public base URL of the deployed app (server-side only). */
export async function getAppUrl(): Promise<string> {
  return resolveAppUrl({
    explicit: process.env.NEXT_PUBLIC_APP_URL,
    vercelEnv: process.env.VERCEL_ENV,
    vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    vercelUrl: process.env.VERCEL_URL,
    requestOrigin: await getRequestOrigin(),
  });
}
