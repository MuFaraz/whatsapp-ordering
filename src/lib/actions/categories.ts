"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LIMITS } from "@/config/site";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireOwner } from "@/lib/auth/dal";
import { rateLimit } from "@/lib/rate-limit";
import { categorySchema, fieldErrorsOf, idSchema } from "@/lib/validation";
import type { MenuCategory } from "@/types/database";

function revalidate(slug: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/menu/${slug}`);
}

async function ownerWithLimit() {
  const ctx = await requireOwner();
  const allowed = rateLimit(`menu-write:${ctx.user.id}`, 120, 60 * 1000).allowed;
  return { ...ctx, allowed };
}

const TOO_FAST = "You're making changes too quickly. Please wait a moment.";

export async function createCategoryAction(
  input: unknown,
): Promise<ActionResult<MenuCategory>> {
  const { supabase, restaurant, allowed } = await ownerWithLimit();
  if (!allowed) return fail(TOO_FAST);

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
  }

  const { data: last } = await supabase
    .from("menu_categories")
    .select("sort_order")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("menu_categories")
    .insert({
      restaurant_id: restaurant.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return fail("A category with this name already exists.", {
        name: "A category with this name already exists",
      });
    }
    if (error.code === "P0001") {
      return fail(`You can have up to ${LIMITS.categoriesPerRestaurant} categories.`);
    }
    return fail("We couldn't create the category. Please try again.");
  }

  revalidate(restaurant.slug);
  return ok(data, "Category created");
}

export async function updateCategoryAction(
  id: unknown,
  input: unknown,
): Promise<ActionResult<MenuCategory>> {
  const { supabase, restaurant, allowed } = await ownerWithLimit();
  if (!allowed) return fail(TOO_FAST);

  const parsedId = idSchema.safeParse(id);
  const parsed = categorySchema.safeParse(input);
  if (!parsedId.success) return fail("Category not found.");
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
  }

  const { data, error } = await supabase
    .from("menu_categories")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .eq("id", parsedId.data)
    .eq("restaurant_id", restaurant.id)
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return fail("A category with this name already exists.", {
        name: "A category with this name already exists",
      });
    }
    return fail("We couldn't update the category. Please try again.");
  }
  if (!data) return fail("Category not found.");

  revalidate(restaurant.slug);
  return ok(data, "Category updated");
}

const deleteSchema = z.discriminatedUnion("strategy", [
  z.object({ strategy: z.literal("empty-only") }),
  z.object({ strategy: z.literal("move-items"), targetCategoryId: idSchema }),
  z.object({ strategy: z.literal("delete-items") }),
]);

export async function deleteCategoryAction(
  id: unknown,
  options: unknown,
): Promise<ActionResult> {
  const { supabase, restaurant, allowed } = await ownerWithLimit();
  if (!allowed) return fail(TOO_FAST);

  const parsedId = idSchema.safeParse(id);
  const parsedOptions = deleteSchema.safeParse(options);
  if (!parsedId.success || !parsedOptions.success) return fail("Invalid request.");
  const categoryId = parsedId.data;
  const opts = parsedOptions.data;

  const { data: category } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  if (!category) return fail("Category not found.");

  const { count, error: countError } = await supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("restaurant_id", restaurant.id);
  if (countError) return fail("We couldn't check this category's items.");

  if ((count ?? 0) > 0) {
    if (opts.strategy === "empty-only") {
      return fail(
        "This category still has menu items. Move or delete them first.",
      );
    }

    if (opts.strategy === "move-items") {
      if (opts.targetCategoryId === categoryId) {
        return fail("Choose a different category to move items to.");
      }
      const { data: target } = await supabase
        .from("menu_categories")
        .select("id")
        .eq("id", opts.targetCategoryId)
        .eq("restaurant_id", restaurant.id)
        .maybeSingle();
      if (!target) return fail("Target category not found.");

      const { error } = await supabase
        .from("menu_items")
        .update({ category_id: target.id })
        .eq("category_id", categoryId)
        .eq("restaurant_id", restaurant.id);
      if (error) return fail("We couldn't move the items. Nothing was deleted.");
    }

    if (opts.strategy === "delete-items") {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("category_id", categoryId)
        .eq("restaurant_id", restaurant.id);
      if (error) return fail("We couldn't delete the items. Nothing was deleted.");
    }
  }

  // The foreign key is ON DELETE RESTRICT, so this fails safely if any item
  // was added to the category in the meantime.
  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", categoryId)
    .eq("restaurant_id", restaurant.id);
  if (error) {
    if (error.code === "23503") {
      return fail("This category still has menu items. Please try again.");
    }
    return fail("We couldn't delete the category. Please try again.");
  }

  revalidate(restaurant.slug);
  return ok(undefined, "Category deleted");
}

/** Saves a complete new order. Ids must be exactly this restaurant's categories. */
export async function reorderCategoriesAction(
  orderedIds: unknown,
): Promise<ActionResult> {
  const { supabase, restaurant, allowed } = await ownerWithLimit();
  if (!allowed) return fail(TOO_FAST);

  const parsed = z
    .array(idSchema)
    .max(LIMITS.categoriesPerRestaurant)
    .safeParse(orderedIds);
  if (!parsed.success) return fail("Invalid order.");

  const { data: existing, error } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("restaurant_id", restaurant.id);
  if (error) return fail("We couldn't load your categories.");

  const existingIds = new Set(existing.map((c) => c.id));
  const ids = parsed.data;
  if (
    ids.length !== existingIds.size ||
    new Set(ids).size !== ids.length ||
    !ids.every((id) => existingIds.has(id))
  ) {
    return fail("Your categories changed. Please refresh and try again.");
  }

  const results = await Promise.all(
    ids.map((id, index) =>
      supabase
        .from("menu_categories")
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
