"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/money";
import type { Currency } from "@/types/database";
import { MenuImage } from "./menu-image";

export type MenuCardItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
};

export function QuantityStepper({
  name,
  quantity,
  onIncrement,
  onDecrement,
  disabled,
  size = "default",
}: {
  name: string;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  size?: "default" | "sm";
}) {
  const btn = size === "sm" ? "size-8" : "size-9";
  return (
    <div className="inline-flex items-center rounded-full border bg-background shadow-sm">
      <Button
        type="button"
        variant="ghost"
        className={cn(btn, "rounded-full p-0")}
        onClick={onDecrement}
        disabled={disabled}
        aria-label={quantity === 1 ? `Remove ${name}` : `Decrease ${name} quantity`}
      >
        <Minus />
      </Button>
      <span className="min-w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        <span className="sr-only">{name} quantity: </span>
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        className={cn(btn, "rounded-full p-0")}
        onClick={onIncrement}
        disabled={disabled}
        aria-label={`Increase ${name} quantity`}
      >
        <Plus />
      </Button>
    </div>
  );
}

export function MenuItemCard({
  item,
  currency,
  quantity = 0,
  onAdd,
  onIncrement,
  onDecrement,
  preview = false,
  maxQuantity = 50,
}: {
  item: MenuCardItem;
  currency: Currency;
  quantity?: number;
  onAdd?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  /** Static preview (dashboard): shows controls but they do nothing. */
  preview?: boolean;
  maxQuantity?: number;
}) {
  const unavailable = !item.is_available;

  return (
    <article
      className={cn(
        "flex gap-3 rounded-2xl border bg-card p-3 shadow-xs transition-shadow sm:gap-4",
        unavailable ? "opacity-75" : "hover:shadow-md",
      )}
      aria-label={item.name}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-semibold leading-snug">{item.name || "Untitled item"}</h3>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <p className="font-semibold text-primary tabular-nums">
            {formatPrice(item.price, currency)}
          </p>
          {unavailable ? (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Currently unavailable
            </span>
          ) : quantity > 0 ? (
            <QuantityStepper
              name={item.name}
              quantity={quantity}
              onIncrement={() => !preview && onIncrement?.()}
              onDecrement={() => !preview && onDecrement?.()}
              size="sm"
            />
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full px-3.5"
              onClick={() => !preview && onAdd?.()}
              disabled={quantity >= maxQuantity}
              aria-label={`Add ${item.name} to order`}
            >
              <Plus aria-hidden /> Add
            </Button>
          )}
        </div>
      </div>
      <MenuImage
        src={item.image_url}
        alt={item.name}
        className={cn(
          "size-24 shrink-0 rounded-xl sm:size-28",
          unavailable && "grayscale",
        )}
        sizes="(max-width: 640px) 96px, 112px"
      />
    </article>
  );
}
