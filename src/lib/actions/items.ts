"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LIMITS } from "@/config/site";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireOwner } from "@/lib/auth/dal";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrorsOf, idSchema, menuItemSchema } from "@/lib/validation";
import type { MenuItem } from "@/types/database";
import { removeImageIfOwned, validateImageUrl } from "./images.server";

function revalidate(slug: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/menu/${slug}`);
}

const TOO_FAST = "You're making changes too quickly. Please wait a moment.";

async function ownerWithLimit() {
  const ctx = await requireOwner();
  const allowed = rateLimit(`menu-write:${ctx.user.id}`, 120, 60 * 1000).allowed;
  return { ...ctx, allowed };
}

type OwnerContext = Awaited<ReturnType<typeof requireOwner>>;

async function categoryBelongsToRestaurant(
  { supabase, restaurant }: OwnerContext,
  categoryId: string,
) {
  const { data } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  return Boolean(data);
}

export async function createMenuItemAction(
  input: unknown,
): Promise<ActionResult<MenuItem>> {
  const ctx = await ownerWithLimit();
  if (!ctx.allowed) return fail(TOO_FAST);
  const { supabase, restaurant } = ctx;

  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
  }
  const v = parsed.data;

  if (!(await categoryBelongsToRestaurant(ctx, v.categoryId))) {
    return fail("Choose a valid category.", { categoryId: "Choose a valid category" });
  }
  const image = validateImageUrl(v.imageUrl, restaurant.id);
  if (!image.ok) return fail("Invalid image. Please upload it again.");

  const { data: last } = await supabase
    .from("menu_items")
    .select("sort_order")
    .eq("category_id", v.categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      restaurant_id: restaurant.id,
      category_id: v.categoryId,
      name: v.name,
      description: v.description || null,
      price: Number(v.price),
      image_url: image.value,
      is_available: v.isAvailable,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "P0001") {
      return fail(`You can have up to ${LIMITS.itemsPerRestaurant} menu items.`);
    }
    console.error("createMenuItem", error);
    return fail("We couldn't add the item. Please try again.");
  }

  revalidate(restaurant.slug);
  return ok(data, "Item added");
}

export async function updateMenuItemAction(
  id: unknown,
  input: unknown,
): Promise<ActionResult<MenuItem>> {
  const ctx = await ownerWithLimit();
  if (!ctx.allowed) return fail(TOO_FAST);
  const { supabase, restaurant } = ctx;

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return fail("Item not found.");
  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
  }
  const v = parsed.data;

  const { data: existing } = await supabase
    .from("menu_items")
    .select("id, image_url")
    .eq("id", parsedId.data)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  if (!existing) return fail("Item not found.");

  if (!(await categoryBelongsToRestaurant(ctx, v.categoryId))) {
    return fail("Choose a valid category.", { categoryId: "Choose a valid category" });
  }
  const image = validateImageUrl(v.imageUrl, restaurant.id, existing.image_url);
  if (!image.ok) return fail("Invalid image. Please upload it again.");

  const { data, error } = await supabase
    .from("menu_items")
    .update({
      category_id: v.categoryId,
      name: v.name,
      description: v.description || null,
      price: Number(v.price),
      image_url: image.value,
      is_available: v.isAvailable,
    })
    .eq("id", existing.id)
    .eq("restaurant_id", restaurant.id)
    .select("*")
    .single();

  if (error) {
    console.error("updateMenuItem", error);
    return fail("We couldn't save the item. Please try again.");
  }

  if (existing.image_url && existing.image_url !== image.value) {
    await removeImageIfOwned(supabase, existing.image_url, restaurant.id);
  }

  revalidate(restaurant.slug);
  return ok(data, "Item saved");
}

export async function setMenuItemAvailabilityAction(
  id: unknown,
  isAvailable: unknown,
): Promise<ActionResult<MenuItem>> {
  const ctx = await ownerWithLimit();
  if (!ctx.allowed) return fail(TOO_FAST);
  const { supabase, restaurant } = ctx;

  const parsedId = idSchema.safeParse(id);
  const parsedValue = z.boolean().safeParse(isAvailable);
  if (!parsedId.success || !parsedValue.success) return fail("Invalid request.");

  const { data, error } = await supabase
    .from("menu_items")
    .update({ is_available: parsedValue.data })
    .eq("id", parsedId.data)
    .eq("restaurant_id", restaurant.id)
    .select("*")
    .maybeSingle();

  if (error) return fail("We couldn't update availability. Please try again.");
  if (!data) return fail("Item not found.");

  revalidate(restaurant.slug);
  return ok(data, parsedValue.data ? "Marked as available" : "Marked as unavailable");
}

export async function deleteMenuItemAction(id: unknown): Promise<ActionResult> {
  const ctx = await ownerWithLimit();
  if (!ctx.allowed) return fail(TOO_FAST);
  const { supabase, restaurant } = ctx;

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return fail("Item not found.");

  const { data, error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", parsedId.data)
    .eq("restaurant_id", restaurant.id)
    .select("id, image_url")
    .maybeSingle();

  if (error) return fail("We couldn't delete the item. Please try again.");
  if (!data) return fail("Item not found.");

  await removeImageIfOwned(supabase, data.image_url, restaurant.id);
  revalidate(restaurant.slug);
  return ok(undefined, "Item deleted");
}

/**
 * Saves a new item order within one category. The ids must be exactly the
 * items currently in that category of the owner's restaurant.
 */
export async function reorderMenuItemsAction(
  categoryId: unknown,
  orderedIds: unknown,
): Promise<ActionResult> {
  const ctx = await ownerWithLimit();
  if (!ctx.allowed) return fail(TOO_FAST);
  const { supabase, restaurant } = ctx;

  const parsedCategory = idSchema.safeParse(categoryId);
  const parsedIds = z.array(idSchema).max(LIMITS.itemsPerRestaurant).safeParse(orderedIds);
  if (!parsedCategory.success || !parsedIds.success) return fail("Invalid order.");

  const { data: existing, error } = await supabase
    .from("menu_items")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("category_id", parsedCategory.data);
  if (error) return fail("We couldn't load the items in this category.");

  const existingIds = new Set(existing.map((i) => i.id));
  const ids = parsedIds.data;
  if (
    ids.length !== existingIds.size ||
    new Set(ids).size !== ids.length ||
    !ids.every((id) => existingIds.has(id))
  ) {
    return fail("Your menu changed. Please refresh and try again.");
  }

  const results = await Promise.all(
    ids.map((id, index) =>
      supabase
        .from("menu_items")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("restaurant_id", restaurant.id),
    ),
  );
  if (results.some((r) => r.error)) {
    return fail("We couldn't save the new order. Please try again.");
  }

  revalidate(restaurant.slug);
  return ok(undefined, "Order saved");
}
