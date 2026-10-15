"use client";

import { Check, Copy, Download, ExternalLink, Printer, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/slug";
import { PageHeader } from "./dashboard-shell";

export function QrCodeView({
  menuUrl,
  restaurantName,
  svg,
  pngDataUrl,
  printHref,
}: {
  menuUrl: string;
  restaurantName: string;
  svg: string;
  pngDataUrl: string;
  printHref: string;
}) {
  const [copied, setCopied] = useState(false);
  const fileBase = `${slugify(restaurantName) || "menu"}-qr-code`;
  const svgHref = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const isLocal = /\/\/(localhost|127\.0\.0\.1)/.test(menuUrl);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      toast.success("Menu link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  };

  return (
    <>
      <PageHeader
        title="QR code"
        description="Print it for your tables, counter and takeaway bags."
      />

      {isLocal && (
        <Alert className="mb-6">
          <TriangleAlert />
          <AlertTitle>This QR code points to your local computer</AlertTitle>
          <AlertDescription>
            Phones can&apos;t open {menuUrl}. Deploy the app (or set NEXT_PUBLIC_APP_URL) before printing.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className="min-w-0">
          <CardContent className="grid min-w-0 gap-4 [&>*]:min-w-0">
            <div className="mx-auto w-full max-w-72 rounded-2xl border bg-white p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
              <img
                src={pngDataUrl}
                alt={`QR code linking to ${menuUrl}`}
                width={1024}
                height={1024}
                className="h-auto w-full"
              />
              <p className="mt-2 text-center text-sm font-semibold text-neutral-900">
                Scan to view our menu
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/60 p-2">
              <code className="min-w-0 flex-1 truncate px-1 text-sm">{menuUrl}</code>
              <Button variant="ghost" size="icon-sm" onClick={copy} aria-label="Copy menu link">
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 [&>*]:min-w-0">
              <Button asChild>
                <a href={pngDataUrl} download={`${fileBase}.png`}>
                  <Download aria-hidden /> Download PNG
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={svgHref} download={`${fileBase}.svg`}>
                  <Download aria-hidden /> Download SVG
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link href={printHref}>
                  <Printer aria-hidden /> Printable table cards
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a href={menuUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden /> Test the link
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to use your QR code</CardTitle>
            <CardDescription>A few tips for the best results.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-4 text-sm">
              {[
                ["Test it first", "Scan the code with your own phone camera and place a test order to your WhatsApp."],
                ["Print it", "Use “Printable table cards” for ready-made cards, or the PNG/SVG for your own designs. SVG stays sharp at any size."],
                ["Keep it big enough", "At least 3 × 3 cm (about 1.2 inches). Bigger is better for tables far from customers."],
                ["Place it where people wait", "Tables, the counter, the entrance and takeaway packaging. Laminated cards or acrylic stands last longest."],
                ["Keep your link stable", "The code points to your menu link. Menu changes appear instantly without reprinting, but changing your link in Settings needs new codes."],
              ].map(([title, text], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-medium">{title}</span>
                    <span className="text-muted-foreground">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
