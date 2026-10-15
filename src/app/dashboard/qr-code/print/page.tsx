import type { Metadata } from "next";
import { PrintableQr } from "@/components/dashboard/printable-qr";
import { buildMenuUrl } from "@/lib/app-url";
import { getAppUrl } from "@/lib/app-url.server";
import { requireOwner } from "@/lib/auth/dal";
import { generateMenuQr } from "@/lib/qr";

export const metadata: Metadata = { title: "Print QR code" };

export default async function PrintQrPage() {
  const { restaurant } = await requireOwner();
  const menuUrl = buildMenuUrl(await getAppUrl(), restaurant.slug);
  const { svg } = await generateMenuQr(menuUrl);

  return (
    <PrintableQr
      restaurantName={restaurant.name}
      logoUrl={restaurant.logo_url}
      svg={svg}
      menuUrl={menuUrl}
      backHref="/dashboard/qr-code"
    />
  );
}
