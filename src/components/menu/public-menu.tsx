"use client";

import { FlaskConical, Mail, MapPin, Phone, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { PublicRestaurant } from "@/lib/data/menu";
import { formatPrice, fromMinorUnits } from "@/lib/money";
import { priceCart } from "@/lib/order/cart";
import type { MenuCategory, MenuItem } from "@/types/database";
import { CartSheet } from "./cart-sheet";
import { useCart } from "./cart-store";
import { CategoryNav } from "./category-nav";
import { MenuImage } from "./menu-image";
import { MenuItemCard } from "./menu-item-card";

export function PublicMenu({
  restaurant,
  categories,
  items,
}: {
  restaurant: PublicRestaurant;
  categories: MenuCategory[];
  items: MenuItem[];
}) {
  const cart = useCart(restaurant.slug);
  const [cartOpen, setCartOpen] = useState(false);

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const priced = useMemo(() => priceCart(cart.lines, itemsById), [cart.lines, itemsById]);

  // Drop saved cart lines for items that were removed or sold out since.
  const { prune } = cart;
  useEffect(() => {
    prune((id) => itemsById.get(id)?.is_available === true);
  }, [prune, itemsById]);

  const sections = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          items: items.filter((i) => i.category_id === category.id),
        }))
        .filter((s) => s.items.length > 0),
    [categories, items],
  );

  const currency = restaurant.currency;

  return (
    <div className="min-h-svh bg-background pb-28">
      {restaurant.is_demo && (
        <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
          <FlaskConical className="mr-1.5 inline size-4 align-[-3px]" aria-hidden />
          <strong>Demo menu.</strong> {restaurant.name} is a fictional restaurant showing how{" "}
          <Link href="/" className="font-semibold underline underline-offset-2">
            {siteConfig.name}
          </Link>{" "}
          works.
        </div>
      )}

      <header className="relative">
        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary to-[oklch(0.45_0.15_35)] sm:h-56">
          {restaurant.cover_url && (
            <MenuImage
              src={restaurant.cover_url}
              alt=""
              className="absolute inset-0 size-full"
              sizes="100vw"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="mx-auto max-w-3xl px-4">
          <div className="relative -mt-12 flex items-end gap-4">
            <MenuImage
              src={restaurant.logo_url}
              alt={`${restaurant.name} logo`}
              className="size-24 shrink-0 rounded-2xl border-4 border-background shadow-md"
              sizes="96px"
              priority
            />
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">{restaurant.name}</h1>
          {restaurant.description && (
            <p className="mt-1.5 text-muted-foreground">{restaurant.description}</p>
          )}
          <p className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            {restaurant.accepts_dine_in && <span className="rounded-full bg-secondary px-2.5 py-1">Dine-in</span>}
            {restaurant.accepts_takeaway && <span className="rounded-full bg-secondary px-2.5 py-1">Takeaway</span>}
            {restaurant.accepts_delivery && <span className="rounded-full bg-secondary px-2.5 py-1">Delivery</span>}
            <span className="rounded-full bg-[#e7f6e9] px-2.5 py-1 text-[#10351c]">Order via WhatsApp</span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4">
        {sections.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
            <p className="font-semibold">The menu is being prepared</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Please check back soon or ask our staff for today&apos;s menu.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <CategoryNav categories={sections.map((s) => s.category)} />
            </div>
            {sections.map(({ category, items: sectionItems }) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                aria-labelledby={`heading-${category.id}`}
                className="scroll-mt-20 pt-6"
              >
                <h2 id={`heading-${category.id}`} className="font-display text-xl font-semibold">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{category.description}</p>
                )}
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {sectionItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      quantity={cart.quantityOf(item.id)}
                      onAdd={() => cart.add(item.id)}
                      onIncrement={() => cart.increment(item.id)}
                      onDecrement={() => cart.decrement(item.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        <footer className="mt-12 grid gap-3 border-t pt-6 text-sm text-muted-foreground">
          {(restaurant.address || restaurant.contact_phone || restaurant.contact_email) && (
            <ul className="grid gap-2">
              {restaurant.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {restaurant.address}
                </li>
              )}
              {restaurant.contact_phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0" aria-hidden />
                  <a href={`tel:${restaurant.contact_phone.replace(/[^\d+]/g, "")}`} className="hover:text-foreground">
                    {restaurant.contact_phone}
                  </a>
                </li>
              )}
              {restaurant.contact_email && (
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0" aria-hidden />
                  <a href={`mailto:${restaurant.contact_email}`} className="hover:text-foreground">
                    {restaurant.contact_email}
                  </a>
                </li>
              )}
            </ul>
          )}
          <p className="text-xs">
            Prices are set by the restaurant. Orders are sent as WhatsApp messages and are confirmed by
            the restaurant directly.
          </p>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs hover:text-foreground">
            <LogoMark className="size-4" /> Powered by {siteConfig.name}
          </Link>
        </footer>
      </main>

      {priced.itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-3 sm:p-4">
          <Button
            size="lg"
            onClick={() => setCartOpen(true)}
            className="mx-auto flex h-14 w-full max-w-lg justify-between rounded-2xl px-5 text-base shadow-xl"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag aria-hidden />
              View order
              <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-sm tabular-nums">
                {priced.itemCount}
              </span>
            </span>
            <span className="tabular-nums">
              {formatPrice(fromMinorUnits(priced.subtotalMinor), currency)}
            </span>
          </Button>
        </div>
      )}

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        slug={restaurant.slug}
        restaurantName={restaurant.name}
        currency={currency}
        isDemo={restaurant.is_demo}
        options={{
          dine_in: restaurant.accepts_dine_in,
          takeaway: restaurant.accepts_takeaway,
          delivery: restaurant.accepts_delivery,
          tableNumber: restaurant.table_number_enabled,
        }}
        priced={priced}
        onIncrement={cart.increment}
        onDecrement={cart.decrement}
        onRemove={cart.remove}
        onClear={cart.clear}
      />
    </div>
  );
}
