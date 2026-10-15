import type { Metadata } from "next";
import { QrCodeView } from "@/components/dashboard/qr-code-view";
import { buildMenuUrl } from "@/lib/app-url";
import { getAppUrl } from "@/lib/app-url.server";
import { requireOwner } from "@/lib/auth/dal";
import { generateMenuQr } from "@/lib/qr";

export const metadata: Metadata = { title: "QR code" };

export default async function QrCodePage() {
  const { restaurant } = await requireOwner();
  const menuUrl = buildMenuUrl(await getAppUrl(), restaurant.slug);
  const qr = await generateMenuQr(menuUrl);

  return (
    <QrCodeView
      menuUrl={menuUrl}
      restaurantName={restaurant.name}
      svg={qr.svg}
      pngDataUrl={qr.pngDataUrl}
      printHref="/dashboard/qr-code/print"
    />
  );
}
