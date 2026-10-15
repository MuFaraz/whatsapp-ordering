import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LiveOpsProvider } from "@/components/dashboard/ops-context";
import { SetupRequired } from "@/components/setup-required";
import { requireOwner } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | Dashboard" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="px-4 py-16">
        <SetupRequired feature="The dashboard and accounts" />
      </main>
    );
  }

  // Verifies the session and ownership; redirects to /login or /onboarding.
  const { restaurant } = await requireOwner();

  return (
    <LiveOpsProvider restaurantId={restaurant.id}>
      <DashboardShell
        restaurant={{ name: restaurant.name, slug: restaurant.slug, logo_url: restaurant.logo_url }}
        basePath="/dashboard"
      >
        {children}
      </DashboardShell>
    </LiveOpsProvider>
  );
}
