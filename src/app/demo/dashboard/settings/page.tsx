import type { Metadata } from "next";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { demoRestaurant } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Settings" };

export default function DemoSettingsPage() {
  return <SettingsForm restaurant={demoRestaurant} />;
}
