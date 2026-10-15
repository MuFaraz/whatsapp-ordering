import {
  BadgePercent,
  Clock,
  FolderTree,
  ImageIcon,
  LayoutDashboard,
  MessageCircle,
  Printer,
  QrCode,
  ShoppingBag,
  Smartphone,
  ToggleRight,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { DemoQr } from "@/components/marketing/demo-qr";
import { Faq } from "@/components/marketing/faq";
import { PhonePreview } from "@/components/marketing/phone-preview";
import { PricingCards, PricingNote } from "@/components/marketing/pricing-cards";
import { Button } from "@/components/ui/button";
import { DEMO_SLUG, siteConfig } from "@/config/site";
import { getContactLinks } from "@/lib/contact";

const benefits = [
  { icon: Smartphone, title: "No app needed", text: "Customers scan and browse in their phone browser." },
  { icon: BadgePercent, title: "Zero commission", text: "A flat monthly fee. Every order is yours." },
  { icon: Clock, title: "Update in seconds", text: "Change prices or mark items sold out instantly." },
  { icon: MessageCircle, title: "Orders on WhatsApp", text: "Neatly formatted orders, straight to your phone." },
];

const steps = [
  {
    icon: UtensilsCrossed,
    title: "Build your menu",
    text: "Add categories, dishes, photos and prices from your phone or laptop. Takes about 10 minutes.",
  },
  {
    icon: Printer,
    title: "Print your QR code",
    text: "Download a ready-to-print QR card and place it on tables, the counter and takeaway bags.",
  },
  {
    icon: MessageCircle,
    title: "Receive orders on WhatsApp",
    text: "Customers add items to a cart and send you a clear order message. You reply to confirm.",
  },
];

const features = [
  { icon: ImageIcon, title: "Photo menu", text: "Beautiful item cards with photos, descriptions and prices." },
  { icon: FolderTree, title: "Categories", text: "Organise sections and set the order customers see." },
  { icon: ToggleRight, title: "Availability", text: "Sold out? One tap hides the add button until it's back." },
  { icon: ShoppingBag, title: "Cart & order types", text: "Dine-in with table numbers, takeaway or delivery." },
  { icon: QrCode, title: "QR codes", text: "PNG/SVG downloads and printable table cards." },
  { icon: LayoutDashboard, title: "Simple dashboard", text: "Works on mobile. Search, filter and preview items." },
];

export default function LandingPage() {
  const contact = getContactLinks();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--secondary),transparent_55%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium">
              <QrCode className="size-4 text-primary" aria-hidden />
              QR menus + WhatsApp ordering
            </p>
            <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Your menu on every table. Orders straight to WhatsApp.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
              {siteConfig.name} gives your restaurant a beautiful digital menu and a QR code for every
              table. Customers order from their phone, and the order arrives on your WhatsApp. No apps,
              no commission.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href={`/menu/${DEMO_SLUG}`}>
                  <Smartphone aria-hidden /> Try live menu
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link href="/demo/dashboard">
                  <LayoutDashboard aria-hidden /> Explore dashboard demo
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No sign-up needed for the demo. Starter plan from PKR 1,000/month.
            </p>
          </div>
          <div className="hidden md:block">
            <PhonePreview />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section aria-labelledby="benefits-heading" className="border-y bg-card">
        <h2 id="benefits-heading" className="sr-only">Benefits</h2>
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Icon className="size-5 text-primary" aria-hidden />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">From paper menu to WhatsApp orders in three steps.</p>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative rounded-2xl border bg-card p-6 shadow-xs">
                <span className="absolute top-6 right-6 font-display text-5xl font-semibold text-secondary">
                  {i + 1}
                </span>
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="size-6" aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Live demo */}
      <section aria-labelledby="demo-heading" className="bg-[oklch(0.25_0.04_40)] text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_auto]">
          <div>
            <h2 id="demo-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              See it on your own phone
            </h2>
            <p className="mt-3 max-w-xl text-white/80">
              Scan the code to open our sample restaurant, &quot;Bun &amp; Brew Café&quot;. Add a few items,
              choose dine-in or delivery and watch the WhatsApp order message get built. It&apos;s a fictional
              restaurant, so nothing is actually ordered.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 bg-white text-neutral-900 hover:bg-white/90">
                <Link href={`/menu/${DEMO_SLUG}`}>Open demo menu</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/demo/dashboard">See the owner dashboard</Link>
              </Button>
            </div>
          </div>
          <DemoQr className="mx-auto w-44 sm:w-52 [&_figcaption]:text-white/70" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything a busy restaurant needs
            </h2>
            <p className="mt-3 text-muted-foreground">Simple enough for anyone on your team to use.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border bg-card p-5">
                <Icon className="size-6 text-primary" aria-hidden />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mt-3 text-muted-foreground">One plan with everything included. No commission.</p>
          </div>
          <PricingCards />
          <PricingNote />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <h2 className="mb-10 text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
          <Faq />
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to put your menu online?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            Set it up yourself in minutes, or let us do it for you: we&apos;ll enter your menu and send
            you print-ready QR cards.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-white px-6 text-base text-neutral-900 hover:bg-white/90">
              <Link href="/signup">Create your menu</Link>
            </Button>
            {contact.whatsapp ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/40 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden /> Get setup help on WhatsApp
                </a>
              </Button>
            ) : contact.email ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/40 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <a href={contact.email}>Email us for setup help</a>
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
