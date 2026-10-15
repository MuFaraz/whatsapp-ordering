"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { LIMITS } from "@/config/site";
import { clampQuantity, sanitizeCart, type CartLine } from "@/lib/order/cart";

/*
 * Per-restaurant cart persisted in localStorage. Only item ids and quantities
 * are stored; prices always come from the menu data.
 */

const EMPTY: CartLine[] = [];
const cache = new Map<string, CartLine[]>();
const listeners = new Set<() => void>();

const storageKey = (slug: string) => `bb-cart:${slug}`;

function read(slug: string): CartLine[] {
  const cached = cache.get(slug);
  if (cached) return cached;
  let lines: CartLine[] = EMPTY;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        lines = sanitizeCart(
          parsed.filter(
            (l): l is CartLine =>
              typeof l === "object" && l !== null &&
              typeof (l as CartLine).itemId === "string" &&
              typeof (l as CartLine).quantity === "number",
          ),
        );
      }
    }
  } catch {
    // Storage unavailable (private mode) or corrupted: start empty.
  }
  cache.set(slug, lines);
  return lines;
}

function write(slug: string, lines: CartLine[]) {
  cache.set(slug, lines);
  try {
    if (lines.length === 0) window.localStorage.removeItem(storageKey(slug));
    else window.localStorage.setItem(storageKey(slug), JSON.stringify(lines));
  } catch {
    // Ignore quota/private-mode errors; the in-memory cart still works.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCart(slug: string) {
  const lines = useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => EMPTY,
  );

  const setQuantity = useCallback(
    (itemId: string, quantity: number) => {
      const current = read(slug);
      const q = clampQuantity(quantity);
      const exists = current.some((l) => l.itemId === itemId);
      let next: CartLine[];
      if (q === 0) next = current.filter((l) => l.itemId !== itemId);
      else if (exists) next = current.map((l) => (l.itemId === itemId ? { ...l, quantity: q } : l));
      else if (current.length >= LIMITS.maxCartLines) return;
      else next = [...current, { itemId, quantity: q }];
      write(slug, next);
    },
    [slug],
  );

  /** Drops lines for items no longer on the menu or unavailable. */
  const prune = useCallback(
    (keep: (itemId: string) => boolean) => {
      const current = read(slug);
      const next = current.filter((l) => keep(l.itemId));
      if (next.length !== current.length) write(slug, next);
    },
    [slug],
  );

  const quantities = useMemo(
    () => new Map(lines.map((l) => [l.itemId, l.quantity])),
    [lines],
  );

  return {
    lines,
    quantityOf: (itemId: string) => quantities.get(itemId) ?? 0,
    add: (itemId: string) => setQuantity(itemId, (quantities.get(itemId) ?? 0) + 1),
    increment: (itemId: string) => setQuantity(itemId, (quantities.get(itemId) ?? 0) + 1),
    decrement: (itemId: string) => setQuantity(itemId, (quantities.get(itemId) ?? 0) - 1),
    remove: (itemId: string) => setQuantity(itemId, 0),
    prune,
    clear: () => write(slug, []),
  };
}
