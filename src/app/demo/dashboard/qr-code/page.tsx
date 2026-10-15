import type { Metadata } from "next";
import { QrCodeView } from "@/components/dashboard/qr-code-view";
import { DEMO_SLUG } from "@/config/site";
import { buildMenuUrl } from "@/lib/app-url";
import { getAppUrl } from "@/lib/app-url.server";
import { demoRestaurant } from "@/lib/demo-data";
import { generateMenuQr } from "@/lib/qr";

export const metadata: Metadata = { title: "QR code" };

export default async function DemoQrCodePage() {
  const menuUrl = buildMenuUrl(await getAppUrl(), DEMO_SLUG);
  const qr = await generateMenuQr(menuUrl);
  return (
    <QrCodeView
      menuUrl={menuUrl}
      restaurantName={demoRestaurant.name}
      svg={qr.svg}
      pngDataUrl={qr.pngDataUrl}
      printHref="/demo/dashboard/qr-code/print"
    />
  );
}
