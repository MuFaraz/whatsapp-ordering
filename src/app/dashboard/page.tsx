import { OverviewView } from "@/components/dashboard/overview-view";
import { getRequestTime } from "@/lib/request-time.server";
import { getOwnerMenu } from "@/lib/data/owner";

export default async function DashboardPage() {
  const { restaurant, categories, items } = await getOwnerMenu();
  const now = await getRequestTime();
  return (
    <OverviewView
      restaurant={restaurant}
      categories={categories}
      items={items}
      basePath="/dashboard"
      now={now}
    />
  );
}
