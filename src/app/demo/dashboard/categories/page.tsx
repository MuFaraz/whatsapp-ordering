import type { Metadata } from "next";
import { CategoryManager } from "@/components/dashboard/category-manager";
import { demoCategories, demoItems } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Categories" };

export default async function DemoCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const params = await searchParams;
  const counts: Record<string, number> = {};
  for (const item of demoItems) counts[item.category_id] = (counts[item.category_id] ?? 0) + 1;
  return (
    <CategoryManager
      initialCategories={demoCategories}
      initialCounts={counts}
      autoOpenNew={params.new === "1"}
    />
  );
}
