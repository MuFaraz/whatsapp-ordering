/** Must match the `restaurants_slug_not_reserved` constraint in SQL. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "dashboard",
  "demo",
  "login",
  "logout",
  "menu",
  "onboarding",
  "pricing",
  "settings",
  "signup",
  "support",
  "help",
  "www",
  "static",
  "assets",
  "bun-and-brew-demo",
]);

/** Must match the `restaurants_slug_format` constraint in SQL. */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

export type SlugProblem = "format" | "reserved" | null;

export function getSlugProblem(slug: string): SlugProblem {
  if (!SLUG_PATTERN.test(slug) || slug.includes("--")) return "format";
  if (RESERVED_SLUGS.has(slug)) return "reserved";
  return null;
}
