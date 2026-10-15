import type { Metadata } from "next";
import { Faq } from "@/components/marketing/faq";
import { PricingCards, PricingNote } from "@/components/marketing/pricing-cards";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple monthly pricing for QR menus with WhatsApp ordering. No commission.",
};

export default function PricingPage() {
  return (
    <>
      <section className="bg-[radial-gradient(ellipse_at_top,var(--secondary),transparent_60%)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Pricing</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              One simple plan for your QR menu and WhatsApp orders, plus optional help getting set up.
            </p>
          </div>
          <PricingCards />
          <PricingNote />
        </div>
      </section>
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-center font-display text-3xl font-semibold tracking-tight">
            Frequently asked questions
          </h2>
          <Faq />
        </div>
      </section>
    </>
  );
}
