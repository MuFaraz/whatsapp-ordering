import type { Metadata } from "next";
import { PrintableQr } from "@/components/dashboard/printable-qr";
import { DEMO_SLUG } from "@/config/site";
import { buildMenuUrl } from "@/lib/app-url";
import { getAppUrl } from "@/lib/app-url.server";
import { demoRestaurant } from "@/lib/demo-data";
import { generateMenuQr } from "@/lib/qr";

export const metadata: Metadata = { title: "Print QR code" };

export default async function DemoPrintQrPage() {
  const menuUrl = buildMenuUrl(await getAppUrl(), DEMO_SLUG);
  const { svg } = await generateMenuQr(menuUrl);
  return (
    <PrintableQr
      restaurantName={demoRestaurant.name}
      logoUrl={demoRestaurant.logo_url}
      svg={svg}
      menuUrl={menuUrl}
      backHref="/demo/dashboard/qr-code"
    />
  );
}
