import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { DemoOpsProvider } from "@/components/dashboard/ops-context";
import { demoRestaurant } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: { default: "Demo dashboard", template: "%s | Demo dashboard" },
  robots: { index: false, follow: false },
};

/**
 * Read-only demo: uses built-in sample data and in-browser "operations".
 * There is no login and no database access, so it cannot affect real data.
 */
export default function DemoDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoOpsProvider restaurantId={demoRestaurant.id}>
      <DashboardShell
        restaurant={{
          name: demoRestaurant.name,
          slug: demoRestaurant.slug,
          logo_url: demoRestaurant.logo_url,
        }}
        basePath="/demo/dashboard"
        isDemo
        banner={<DemoBanner />}
      >
        {children}
      </DashboardShell>
    </DemoOpsProvider>
  );
}
