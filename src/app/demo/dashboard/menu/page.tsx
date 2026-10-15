import type { Metadata } from "next";
import { MenuManager } from "@/components/dashboard/menu-manager";
import { demoCategories, demoItems, demoRestaurant } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Menu items" };

export default async function DemoMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; category?: string }>;
}) {
  const params = await searchParams;
  return (
    <MenuManager
      initialItems={demoItems}
      categories={demoCategories}
      currency={demoRestaurant.currency}
      autoOpenNew={params.new === "1"}
      initialCategoryFilter={params.category}
    />
  );
}
