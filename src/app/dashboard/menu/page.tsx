import type { Metadata } from "next";
import { MenuManager } from "@/components/dashboard/menu-manager";
import { getOwnerMenu } from "@/lib/data/owner";

export const metadata: Metadata = { title: "Menu items" };

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; category?: string }>;
}) {
  const [{ restaurant, categories, items }, params] = await Promise.all([
    getOwnerMenu(),
    searchParams,
  ]);

  return (
    <MenuManager
      initialItems={items}
      categories={categories}
      currency={restaurant.currency}
      autoOpenNew={params.new === "1"}
      initialCategoryFilter={params.category}
    />
  );
}
