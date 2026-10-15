import { OverviewView } from "@/components/dashboard/overview-view";
import { getRequestTime } from "@/lib/request-time.server";
import { demoCategories, demoItems, demoRestaurant } from "@/lib/demo-data";

export default async function DemoOverviewPage() {
  const now = await getRequestTime();
  return (
    <OverviewView
      restaurant={demoRestaurant}
      categories={demoCategories}
      items={demoItems}
      basePath="/demo/dashboard"
      now={now}
    />
  );
}
