"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo } from "react";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  updateCategoryAction,
} from "@/lib/actions/categories";
import {
  createMenuItemAction,
  deleteMenuItemAction,
  reorderMenuItemsAction,
  setMenuItemAvailabilityAction,
  updateMenuItemAction,
} from "@/lib/actions/items";
import { updateRestaurantSettingsAction } from "@/lib/actions/restaurant";
import { discardUploadedImagesAction } from "@/lib/actions/uploads";
import { uploadMenuImage, validateImageFile, type ImageKind } from "@/lib/image-upload";
import {
  categorySchema,
  fieldErrorsOf,
  menuItemSchema,
  restaurantSettingsSchema,
  type CategoryInput,
  type MenuItemInput,
  type RestaurantSettingsInput,
} from "@/lib/validation";
import type { MenuCategory, MenuItem } from "@/types/database";

export type DeleteCategoryOptions =
  | { strategy: "empty-only" }
  | { strategy: "move-items"; targetCategoryId: string }
  | { strategy: "delete-items" };

export type DashboardOps = {
  mode: "live" | "demo";
  basePath: string;
  uploadImage(file: File, kind: ImageKind): Promise<string>;
  /** Removes uploaded-but-unsaved images (best effort, never throws). */
  discardImages(urls: string[]): void;
  createCategory(input: CategoryInput): Promise<ActionResult<MenuCategory>>;
  updateCategory(id: string, input: CategoryInput): Promise<ActionResult<MenuCategory>>;
  deleteCategory(id: string, options: DeleteCategoryOptions): Promise<ActionResult>;
  reorderCategories(ids: string[]): Promise<ActionResult>;
  createItem(input: MenuItemInput): Promise<ActionResult<MenuItem>>;
  updateItem(id: string, input: MenuItemInput): Promise<ActionResult<MenuItem>>;
  setAvailability(id: string, value: boolean): Promise<ActionResult<MenuItem>>;
  reorderItems(categoryId: string, ids: string[]): Promise<ActionResult>;
  deleteItem(id: string): Promise<ActionResult>;
  updateSettings(input: RestaurantSettingsInput): Promise<ActionResult<{ slug: string }>>;
};

const OpsContext = createContext<DashboardOps | null>(null);

export function useDashboardOps(): DashboardOps {
  const ops = useContext(OpsContext);
  if (!ops) throw new Error("useDashboardOps must be used inside DashboardOpsProvider");
  return ops;
}

/** Real operations: Server Actions + Supabase Storage. */
export function LiveOpsProvider({
  restaurantId,
  children,
}: {
  restaurantId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const ops = useMemo<DashboardOps>(() => {
    // Refresh server components after every successful mutation.
    const refreshing =
      <A extends unknown[], R>(fn: (...args: A) => Promise<ActionResult<R>>) =>
      async (...args: A) => {
        const result = await fn(...args);
        if (result.ok) router.refresh();
        return result;
      };

    return {
      mode: "live",
      basePath: "/dashboard",
      uploadImage: (file, kind) => uploadMenuImage(file, kind, restaurantId),
      discardImages: (urls) => {
        if (urls.length > 0) void discardUploadedImagesAction(urls).catch(() => undefined);
      },
      createCategory: refreshing(createCategoryAction),
      updateCategory: refreshing(updateCategoryAction),
      deleteCategory: refreshing(deleteCategoryAction),
      reorderCategories: refreshing(reorderCategoriesAction),
      createItem: refreshing(createMenuItemAction),
      updateItem: refreshing(updateMenuItemAction),
      setAvailability: refreshing(setMenuItemAvailabilityAction),
      reorderItems: refreshing(reorderMenuItemsAction),
      deleteItem: refreshing(deleteMenuItemAction),
      updateSettings: refreshing(updateRestaurantSettingsAction),
    };
  }, [restaurantId, router]);

  return <OpsContext value={ops}>{children}</OpsContext>;
}

/**
 * Demo operations: same validation, but nothing leaves the browser. Changes
 * live only in component state and reset on reload.
 */
export function DemoOpsProvider({
  restaurantId,
  children,
}: {
  restaurantId: string;
  children: React.ReactNode;
}) {
  const ops = useMemo<DashboardOps>(() => {
    const now = () => new Date().toISOString();
    const delay = () => new Promise((r) => setTimeout(r, 250));

    return {
      mode: "demo",
      basePath: "/demo/dashboard",
      async uploadImage(file) {
        const problem = validateImageFile(file);
        if (problem) throw new Error(problem);
        await delay();
        return URL.createObjectURL(file);
      },
      discardImages(urls) {
        urls.filter((u) => u.startsWith("blob:")).forEach((u) => URL.revokeObjectURL(u));
      },
      async reorderItems() {
        return ok(undefined, "Order saved (demo only)");
      },
      async createCategory(input) {
        const parsed = categorySchema.safeParse(input);
        if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
        await delay();
        return ok(
          {
            id: crypto.randomUUID(),
            restaurant_id: restaurantId,
            name: parsed.data.name,
            description: parsed.data.description || null,
            sort_order: 999,
            created_at: now(),
            updated_at: now(),
          },
          "Category created (demo only)",
        );
      },
      async updateCategory(id, input) {
        const parsed = categorySchema.safeParse(input);
        if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
        await delay();
        return ok(
          {
            id,
            restaurant_id: restaurantId,
            name: parsed.data.name,
            description: parsed.data.description || null,
            sort_order: 0,
            created_at: now(),
            updated_at: now(),
          },
          "Category updated (demo only)",
        );
      },
      async deleteCategory() {
        await delay();
        return ok(undefined, "Category deleted (demo only)");
      },
      async reorderCategories() {
        return ok(undefined, "Order saved (demo only)");
      },
      async createItem(input) {
        const parsed = menuItemSchema.safeParse(input);
        if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
        await delay();
        const v = parsed.data;
        return ok(
          {
            id: crypto.randomUUID(),
            restaurant_id: restaurantId,
            category_id: v.categoryId,
            name: v.name,
            description: v.description || null,
            price: Number(v.price),
            image_url: v.imageUrl,
            is_available: v.isAvailable,
            sort_order: 999,
            created_at: now(),
            updated_at: now(),
          },
          "Item added (demo only)",
        );
      },
      async updateItem(id, input) {
        const parsed = menuItemSchema.safeParse(input);
        if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
        await delay();
        const v = parsed.data;
        return ok(
          {
            id,
            restaurant_id: restaurantId,
            category_id: v.categoryId,
            name: v.name,
            description: v.description || null,
            price: Number(v.price),
            image_url: v.imageUrl,
            is_available: v.isAvailable,
            sort_order: 0,
            created_at: now(),
            updated_at: now(),
          },
          "Item saved (demo only)",
        );
      },
      async setAvailability(id, value) {
        // Callers merge the returned flag into their own copy of the item.
        return ok(
          { id, is_available: value } as MenuItem,
          value ? "Marked as available (demo only)" : "Marked as unavailable (demo only)",
        );
      },
      async deleteItem() {
        await delay();
        return ok(undefined, "Item deleted (demo only)");
      },
      async updateSettings(input) {
        const parsed = restaurantSettingsSchema.safeParse(input);
        if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
        await delay();
        return ok({ slug: parsed.data.slug }, "Settings saved (demo only, not stored)");
      },
    };
  }, [restaurantId]);

  return <OpsContext value={ops}>{children}</OpsContext>;
}
