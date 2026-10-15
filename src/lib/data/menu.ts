import "server-only";

import { connection } from "next/server";
import { cache } from "react";
import { demoCategories, demoItems, demoRestaurant, isDemoSlug } from "@/lib/demo-data";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import type { MenuCategory, MenuItem, Restaurant } from "@/types/database";

/** Restaurant fields that are safe to send to customers (no owner_id). */
export type PublicRestaurant = Omit<Restaurant, "owner_id">;

export type PublicMenu = {
  restaurant: PublicRestaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  /** WhatsApp number to order to; null means "let the customer pick a chat". */
  orderPhone: string | null;
};

/** Must match the column grant for `anon` in the migration. */
export const PUBLIC_RESTAURANT_COLUMNS =
  "id, name, slug, description, logo_url, cover_url, whatsapp_number, contact_phone, contact_email, address, currency, is_published, is_demo, accepts_dine_in, accepts_takeaway, accepts_delivery, table_number_enabled, created_at, updated_at";

export function getDemoMenu(): PublicMenu {
  const { owner_id: _ownerId, ...restaurant } = demoRestaurant;
  void _ownerId;
  return {
    restaurant,
    categories: demoCategories,
    items: demoItems,
    orderPhone: publicEnv.demoWhatsappNumber || null,
  };
}

/**
 * Loads a published menu using the anonymous role only. Returns null when the
 * restaurant doesn't exist or isn't published (RLS hides it either way).
 */
export const getPublicMenu = cache(
  async (slug: string): Promise<PublicMenu | null> => {
    if (isDemoSlug(slug)) return getDemoMenu();
    if (!isSupabaseConfigured()) return null;

    // Always render at request time so menu edits show up immediately.
    await connection();

    const supabase = createPublicClient();
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select(PUBLIC_RESTAURANT_COLUMNS)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle<PublicRestaurant>();

    if (error) throw new Error(`Could not load menu: ${error.message}`);
    if (!restaurant) return null;

    const [categoriesResult, itemsResult] = await Promise.all([
      supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("sort_order")
        .order("created_at"),
      supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("sort_order")
        .order("created_at"),
    ]);

    if (categoriesResult.error) throw new Error(categoriesResult.error.message);
    if (itemsResult.error) throw new Error(itemsResult.error.message);

    return {
      restaurant,
      categories: categoriesResult.data,
      items: itemsResult.data,
      orderPhone: restaurant.whatsapp_number,
    };
  },
);
