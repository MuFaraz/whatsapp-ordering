import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { SetupRequired } from "@/components/setup-required";
import { getOwnedRestaurant, requireUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";
import { BrandingStep, CreateRestaurantWizard } from "./onboarding-wizard";

export const metadata: Metadata = { title: "Set up your restaurant" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="px-4 py-16">
        <SetupRequired />
      </main>
    );
  }

  await requireUser();
  const restaurant = await getOwnedRestaurant();
  const { step } = await searchParams;

  if (restaurant && step !== "branding") redirect("/dashboard");

  return (
    <div className="min-h-svh bg-[radial-gradient(ellipse_at_top,var(--secondary),transparent_60%)]">
      <header className="mx-auto flex max-w-3xl items-center px-4 py-5">
        <Logo href="/onboarding" />
      </header>
      <main className="mx-auto max-w-xl px-4 pb-16">
        {restaurant ? (
          <BrandingStep
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            initialDescription={restaurant.description ?? ""}
            initialLogo={restaurant.logo_url}
          />
        ) : (
          <CreateRestaurantWizard />
        )}
      </main>
    </div>
  );
}
