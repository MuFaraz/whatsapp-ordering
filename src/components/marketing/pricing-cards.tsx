import { Check, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LIMITS, pricing } from "@/config/site";
import { getContactLinks } from "@/lib/contact";

/** Only features that exist in the product today. */
const starterFeatures = [
  "Mobile-friendly digital menu with photos",
  `Up to ${LIMITS.itemsPerRestaurant} items in ${LIMITS.categoriesPerRestaurant} categories`,
  "Instant price & availability updates",
  "WhatsApp ordering: dine-in, takeaway, delivery",
  "Table numbers and order notes",
  "QR code downloads + printable table cards",
  "No commission on orders",
];

export function PricingCards() {
  const contact = getContactLinks("the Starter plan");
  const setupContact = getContactLinks("setup assistance for my menu");
  const websiteContact = getContactLinks("a custom restaurant website");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="relative ring-2 ring-primary lg:col-span-1">
        <CardHeader>
          <Badge className="mb-2 w-fit">Most restaurants</Badge>
          <CardTitle className="font-display text-2xl">{pricing.starter.name}</CardTitle>
          <CardDescription>Everything you need to take orders from a QR menu.</CardDescription>
          <p className="mt-3">
            <span className="font-display text-4xl font-semibold">{pricing.starter.priceLabel}</span>
            <span className="text-muted-foreground">{pricing.starter.period}</span>
          </p>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2.5 text-sm">
            {starterFeatures.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="mt-auto grid gap-2 border-t-0 bg-transparent">
          {contact.whatsapp ? (
            <Button asChild size="lg" className="h-11">
              <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden /> Get started on WhatsApp
              </a>
            </Button>
          ) : (
            <Button asChild size="lg" className="h-11">
              <Link href="/signup">Create your menu</Link>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link href="/demo">Try the demo first</Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Setup assistance</CardTitle>
          <CardDescription>Optional one-time service.</CardDescription>
          <p className="mt-3">
            <span className="font-display text-2xl font-semibold">One-time fee</span>
            <span className="block text-sm text-muted-foreground">Quoted based on menu size</span>
          </p>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2.5 text-sm">
            {[
              "We enter your categories, items and prices",
              "Photo upload and description writing",
              "Print-ready QR table cards",
              "Walkthrough for you and your staff",
            ].map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="mt-auto border-t-0 bg-transparent">
          <ContactButton href={setupContact.whatsapp ?? setupContact.email} label="Ask for a quote" />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Custom website</CardTitle>
          <CardDescription>A full website for your restaurant.</CardDescription>
          <p className="mt-3">
            <span className="font-display text-2xl font-semibold">Quoted separately</span>
            <span className="block text-sm text-muted-foreground">Scoped to your needs</span>
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Need more than a menu, like your own domain, an about page or a gallery? We can build a
            custom website as a separate project. Tell us what you have in mind.
          </p>
        </CardContent>
        <CardFooter className="mt-auto border-t-0 bg-transparent">
          <ContactButton href={websiteContact.whatsapp ?? websiteContact.email} label="Discuss a project" />
        </CardFooter>
      </Card>
    </div>
  );
}

function ContactButton({ href, label }: { href: string | null; label: string }) {
  if (!href) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href="/signup">Create an account to get started</Link>
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" className="w-full">
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
        {label}
      </a>
    </Button>
  );
}

export function PricingNote() {
  return (
    <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
      Prices are introductory and may change. There is no online checkout yet: billing is arranged
      with you directly, and no card details are collected on this website.
    </p>
  );
}
