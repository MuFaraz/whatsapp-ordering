export type AppUrlInputs = {
  /** NEXT_PUBLIC_APP_URL */
  explicit?: string;
  /** VERCEL_ENV: "production" | "preview" | "development" */
  vercelEnv?: string;
  /** VERCEL_PROJECT_PRODUCTION_URL (host only, no protocol) */
  vercelProductionUrl?: string;
  /** VERCEL_URL (host only, no protocol) */
  vercelUrl?: string;
  /** Origin derived from the current request, e.g. https://x.vercel.app */
  requestOrigin?: string;
};

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i;

function normalize(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    // Keep only the origin (+ optional base path), never a trailing slash.
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function isLocal(url: string): boolean {
  try {
    return LOCAL_HOST.test(new URL(url).host);
  } catch {
    return false;
  }
}

/**
 * Resolves the public base URL used for QR codes, menu links and auth email
 * redirects. When deployed on Vercel it never returns a localhost URL, so a
 * stray `NEXT_PUBLIC_APP_URL=http://localhost:3000` can't leak into QR codes.
 */
export function resolveAppUrl(input: AppUrlInputs): string {
  const isDeployed =
    input.vercelEnv === "production" || input.vercelEnv === "preview";

  const candidates: Array<string | null> = [
    normalize(input.explicit),
    input.vercelEnv === "production"
      ? normalize(input.vercelProductionUrl)
      : null,
    normalize(input.vercelUrl),
    normalize(input.requestOrigin),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (isDeployed && isLocal(candidate)) continue;
    return candidate;
  }

  return isDeployed ? "" : "http://localhost:3000";
}

export function buildMenuUrl(baseUrl: string, slug: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/menu/${encodeURIComponent(slug)}`;
}
