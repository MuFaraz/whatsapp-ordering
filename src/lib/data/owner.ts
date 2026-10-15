import "server-only";

import { requireOwner } from "@/lib/auth/dal";
import type { MenuCategory, MenuItem, Restaurant } from "@/types/database";

export type OwnerMenu = {
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
};

/** The signed-in owner's full menu (RLS + explicit restaurant filter). */
export async function getOwnerMenu(): Promise<OwnerMenu> {
  const { supabase, restaurant } = await requireOwner();

  const [categories, items] = await Promise.all([
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

  if (categories.error) throw new Error(categories.error.message);
  if (items.error) throw new Error(items.error.message);

  return { restaurant, categories: categories.data, items: items.data };
}
