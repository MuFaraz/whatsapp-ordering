"use client";

import { useEffect, useState } from "react";
import { getSlugProblem } from "@/lib/slug";

export type SlugStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken" }
  | { state: "error"; message: string };

/**
 * Debounced slug availability check. `check` is a Server Action (live mode)
 * or null (demo mode / unchanged slug), in which case nothing is requested.
 */
export function useSlugAvailability(
  slug: string,
  check: ((slug: string) => Promise<{ ok: boolean; available?: boolean; error?: string }>) | null,
): SlugStatus {
  const [status, setStatus] = useState<SlugStatus>({ state: "idle" });
  const [prevKey, setPrevKey] = useState<string | null>(null);

  // Reset synchronously when the slug changes (no setState inside effects).
  const key = `${slug}|${check ? "on" : "off"}`;
  if (key !== prevKey) {
    setPrevKey(key);
    setStatus(check && slug && !getSlugProblem(slug) ? { state: "checking" } : { state: "idle" });
  }

  useEffect(() => {
    if (!check || !slug || getSlugProblem(slug)) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await check(slug);
        if (cancelled) return;
        if (!result.ok) setStatus({ state: "error", message: result.error ?? "Couldn't check" });
        else setStatus(result.available ? { state: "available" } : { state: "taken" });
      } catch {
        if (!cancelled) setStatus({ state: "error", message: "Couldn't check availability" });
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, check]);

  return status;
}
