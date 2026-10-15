"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

type Layout = "single" | "four";

function QrCard({
  restaurantName,
  logoUrl,
  svg,
  menuUrl,
  compact,
}: {
  restaurantName: string;
  logoUrl: string | null;
  svg: string;
  menuUrl: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-300 bg-white text-center text-neutral-900 break-inside-avoid",
        compact ? "gap-2 p-5" : "gap-4 p-10",
      )}
    >
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- print layout
        <img src={logoUrl} alt="" className={cn("rounded-xl object-cover", compact ? "size-12" : "size-20")} />
      )}
      <p className={cn("font-display font-semibold leading-tight", compact ? "text-lg" : "text-3xl")}>
        {restaurantName}
      </p>
      <div
        className={cn(compact ? "w-40" : "w-72", "[&_svg]:h-auto [&_svg]:w-full")}
        // Trusted SVG generated on the server by the qrcode library.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className={cn("font-semibold", compact ? "text-sm" : "text-xl")}>Scan to view our menu</p>
      <p className={cn("text-neutral-600", compact ? "text-[11px]" : "text-sm")}>
        Order easily on WhatsApp
      </p>
      <p className={cn("break-all text-neutral-500", compact ? "text-[9px]" : "text-xs")}>{menuUrl}</p>
    </div>
  );
}

export function PrintableQr({
  restaurantName,
  logoUrl,
  svg,
  menuUrl,
  backHref,
}: {
  restaurantName: string;
  logoUrl: string | null;
  svg: string;
  menuUrl: string;
  backHref: string;
}) {
  const [layout, setLayout] = useState<Layout>("single");
  const card = { restaurantName, logoUrl, svg, menuUrl };

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href={backHref}>
            <ArrowLeft aria-hidden /> Back
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Layout" className="inline-flex rounded-lg border p-0.5">
            {(
              [
                ["single", "1 per page"],
                ["four", "4 per page"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={layout === value ? "secondary" : "ghost"}
                aria-pressed={layout === value}
                onClick={() => setLayout(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Button onClick={() => window.print()}>
            <Printer aria-hidden /> Print
          </Button>
        </div>
      </div>
      <p className="no-print mb-4 text-sm text-muted-foreground">
        Tip: in the print dialog choose A4 or Letter, 100% scale, and enable &quot;Background graphics&quot;.
        Cut along the dashed lines.
      </p>

      <div className="mx-auto max-w-[210mm] bg-white print:max-w-none">
        {layout === "single" ? (
          <div className="flex min-h-[70vh] items-center justify-center print:min-h-[260mm]">
            <QrCard {...card} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 print:gap-[6mm]">
            {Array.from({ length: 4 }).map((_, i) => (
              <QrCard key={i} {...card} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
