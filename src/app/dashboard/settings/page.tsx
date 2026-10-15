import type { Metadata } from "next";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { requireOwner } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { restaurant } = await requireOwner();
  return <SettingsForm key={restaurant.updated_at} restaurant={restaurant} />;
}
