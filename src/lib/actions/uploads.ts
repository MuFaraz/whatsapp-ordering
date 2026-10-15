"use server";

import { z } from "zod";
import { IMAGE_BUCKET } from "@/config/site";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireOwner } from "@/lib/auth/dal";
import { getSupabaseConfig } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { ownedObjectPath } from "@/lib/storage";

/**
 * Deletes images that were uploaded during an edit but never saved (dialog
 * cancelled, or replaced before saving). Only objects in the owner's own
 * folder that no menu item or restaurant row references are removed, so an
 * in-use image can never be deleted through this action.
 */
export async function discardUploadedImagesAction(
  urls: unknown,
): Promise<ActionResult<{ removed: number }>> {
  const { supabase, restaurant, user } = await requireOwner();
  if (!rateLimit(`discard:${user.id}`, 60, 60 * 1000).allowed) {
    return fail("Too many requests.");
  }
  const parsed = z.array(z.string().max(1000)).max(20).safeParse(urls);
  const config = getSupabaseConfig();
  if (!parsed.success || !config) return fail("Invalid request.");

  const candidates = [...new Set(parsed.data)].filter(
    (url) => ownedObjectPath(url, config.url, restaurant.id) !== null,
  );
  if (candidates.length === 0) return ok({ removed: 0 });

  const referenced = new Set<string>();
  if (restaurant.logo_url) referenced.add(restaurant.logo_url);
  if (restaurant.cover_url) referenced.add(restaurant.cover_url);
  const { data: items, error } = await supabase
    .from("menu_items")
    .select("image_url")
    .eq("restaurant_id", restaurant.id)
    .in("image_url", candidates);
  if (error) return fail("Couldn't check image usage.");
  items.forEach((i) => i.image_url && referenced.add(i.image_url));

  const paths = candidates
    .filter((url) => !referenced.has(url))
    .map((url) => ownedObjectPath(url, config.url, restaurant.id)!);
  if (paths.length === 0) return ok({ removed: 0 });

  const { error: removeError } = await supabase.storage.from(IMAGE_BUCKET).remove(paths);
  if (removeError) return fail("Couldn't remove unused images.");
  return ok({ removed: paths.length });
}
