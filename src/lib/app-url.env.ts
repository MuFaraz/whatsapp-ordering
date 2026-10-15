import { resolveAppUrl } from "@/lib/app-url";

/** Base URL from environment only (for build-time files like robots/sitemap). */
export function getEnvAppUrl(): string {
  return resolveAppUrl({
    explicit: process.env.NEXT_PUBLIC_APP_URL,
    vercelEnv: process.env.VERCEL_ENV,
    vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    vercelUrl: process.env.VERCEL_URL,
  });
}
