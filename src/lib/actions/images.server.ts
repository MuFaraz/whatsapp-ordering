import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { IMAGE_BUCKET } from "@/config/site";
import { getSupabaseConfig } from "@/lib/env";
import { ownedObjectPath } from "@/lib/storage";
import type { Database } from "@/types/database";

/**
 * Validates an image URL submitted with a form. `null`/"" clears the image.
 * Anything that isn't an image in this restaurant's storage folder is
 * rejected; unchanged existing URLs are always accepted.
 */
export function validateImageUrl(
  value: string | null,
  restaurantId: string,
  currentValue: string | null = null,
): { ok: true; value: string | null } | { ok: false } {
  if (!value) return { ok: true, value: null };
  if (value === currentValue) return { ok: true, value };
  const config = getSupabaseConfig();
  if (!config) return { ok: false };
  return ownedObjectPath(value, config.url, restaurantId)
    ? { ok: true, value }
    : { ok: false };
}

/** Best-effort removal of a replaced/deleted image (keeps storage tidy). */
export async function removeImageIfOwned(
  supabase: SupabaseClient<Database>,
  url: string | null,
  restaurantId: string,
) {
  if (!url) return;
  const config = getSupabaseConfig();
  if (!config) return;
  const path = ownedObjectPath(url, config.url, restaurantId);
  if (!path) return;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([path]);
  if (error) console.warn("Failed to remove image", path, error.message);
}
