import type { Metadata } from "next";
import { CategoryManager } from "@/components/dashboard/category-manager";
import { getOwnerMenu } from "@/lib/data/owner";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const [{ categories, items }, params] = await Promise.all([getOwnerMenu(), searchParams]);
  const counts: Record<string, number> = {};
  for (const item of items) counts[item.category_id] = (counts[item.category_id] ?? 0) + 1;

  return (
    <CategoryManager
      initialCategories={categories}
      initialCounts={counts}
      autoOpenNew={params.new === "1"}
    />
  );
}
