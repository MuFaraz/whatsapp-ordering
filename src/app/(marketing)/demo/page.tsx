import { ArrowRight, FlaskConical, LayoutDashboard, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DemoQr } from "@/components/marketing/demo-qr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_SLUG } from "@/config/site";
import { publicEnv } from "@/lib/env";
import { normalizePhoneNumber } from "@/lib/phone";

export const metadata: Metadata = {
  title: "Live demo",
  description: "Try the customer menu and the restaurant dashboard with a sample restaurant.",
};

export default function DemoPage() {
  const hasDemoNumber = normalizePhoneNumber(publicEnv.demoWhatsappNumber) !== null;

  return (
    <section className="bg-[radial-gradient(ellipse_at_top,var(--secondary),transparent_60%)]">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-950">
            <FlaskConical className="size-4" aria-hidden /> Sample data, fictional restaurant
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Try {`"Bun & Brew Café"`}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore both sides of the product: what your customers see, and the dashboard you use to
            manage your menu. No sign-up needed.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Smartphone className="size-6" aria-hidden />
              </div>
              <CardTitle className="font-display text-2xl">Customer menu</CardTitle>
              <CardDescription>
                Browse categories, add items to the cart, change quantities and build a WhatsApp order.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <DemoQr className="mx-auto w-44" />
              <Button asChild size="lg" className="h-11">
                <Link href={`/menu/${DEMO_SLUG}`}>
                  Try live menu <ArrowRight aria-hidden />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                {hasDemoNumber
                  ? "Demo orders open a WhatsApp chat with our demo number. Your message is only sent if you press Send."
                  : "Demo orders open WhatsApp with the message prefilled and let you pick any chat. Nothing is sent unless you press Send."}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <LayoutDashboard className="size-6" aria-hidden />
              </div>
              <CardTitle className="font-display text-2xl">Owner dashboard</CardTitle>
              <CardDescription>
                Add and edit dishes, upload photos, reorder categories, mark items sold out and download
                QR codes.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <ul className="grid gap-2 text-sm">
                {[
                  "Overview with live menu stats",
                  "Menu items: search, filter and preview",
                  "Categories you can reorder in one tap",
                  "QR code downloads and printable cards",
                  "Restaurant & ordering settings",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" variant="outline" className="h-11">
                <Link href="/demo/dashboard">
                  Explore dashboard demo <ArrowRight aria-hidden />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                The demo dashboard is a safe sandbox: changes stay in your browser tab and are never saved.
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="mt-10 text-center text-muted-foreground">
          Like what you see?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Create your restaurant&apos;s menu
          </Link>
        </p>
      </div>
    </section>
  );
}
