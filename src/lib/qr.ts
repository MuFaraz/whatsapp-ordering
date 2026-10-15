import "server-only";

import QRCode from "qrcode";

const QR_OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  color: { dark: "#1c1410", light: "#ffffff" },
};

export type MenuQr = { svg: string; pngDataUrl: string };

/** Generates the QR code for a menu URL as SVG (print) and PNG (download). */
export async function generateMenuQr(url: string): Promise<MenuQr> {
  const [svg, pngDataUrl] = await Promise.all([
    QRCode.toString(url, { ...QR_OPTIONS, type: "svg" }),
    QRCode.toDataURL(url, { ...QR_OPTIONS, type: "image/png", width: 1024 }),
  ]);
  return { svg, pngDataUrl };
}
