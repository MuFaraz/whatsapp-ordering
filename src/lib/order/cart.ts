import { LIMITS } from "@/config/site";
import { toMinorUnits } from "@/lib/money";

export type CartLine = { itemId: string; quantity: number };

/** The trusted subset of a menu item needed to price a cart. */
export type PriceableItem = {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
};

export type PricedLine = {
  itemId: string;
  name: string;
  quantity: number;
  /** Unit price in minor units (paisa/cents). */
  unitMinor: number;
  /** Line total in minor units. */
  totalMinor: number;
};

export type PricedCart = {
  lines: PricedLine[];
  subtotalMinor: number;
  itemCount: number;
  /** Names of items that are in the cart but currently unavailable. */
  unavailable: string[];
  /** Cart item ids that no longer exist on the menu. */
  missing: string[];
};

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 0;
  return Math.max(0, Math.min(LIMITS.maxQuantityPerLine, Math.trunc(quantity)));
}

/** Merges duplicate lines, drops zero quantities and enforces limits. */
export function sanitizeCart(lines: CartLine[]): CartLine[] {
  const merged = new Map<string, number>();
  for (const line of lines) {
    if (!line || typeof line.itemId !== "string" || !line.itemId) continue;
    const next = clampQuantity((merged.get(line.itemId) ?? 0) + line.quantity);
    merged.set(line.itemId, next);
  }
  return [...merged.entries()]
    .filter(([, quantity]) => quantity > 0)
    .slice(0, LIMITS.maxCartLines)
    .map(([itemId, quantity]) => ({ itemId, quantity }));
}

/**
 * Prices a cart using trusted menu data only. Client-supplied prices are never
 * accepted; the cart carries item ids and quantities.
 */
export function priceCart(
  cart: CartLine[],
  items: ReadonlyMap<string, PriceableItem>,
): PricedCart {
  const lines: PricedLine[] = [];
  const unavailable: string[] = [];
  const missing: string[] = [];

  for (const { itemId, quantity } of sanitizeCart(cart)) {
    const item = items.get(itemId);
    if (!item) {
      missing.push(itemId);
      continue;
    }
    if (!item.is_available) {
      unavailable.push(item.name);
      continue;
    }
    const unitMinor = toMinorUnits(item.price);
    lines.push({
      itemId,
      name: item.name,
      quantity,
      unitMinor,
      totalMinor: unitMinor * quantity,
    });
  }

  return {
    lines,
    subtotalMinor: lines.reduce((sum, l) => sum + l.totalMinor, 0),
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    unavailable,
    missing,
  };
}
