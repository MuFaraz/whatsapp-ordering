import type { Currency } from "@/types/database";

/** Converts a decimal amount to integer minor units (paisa/cents). */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function fromMinorUnits(minor: number): number {
  return minor / 100;
}

/**
 * Formats a price deterministically (same output on server and client, so no
 * hydration mismatch). Whole amounts are shown without decimals.
 *   formatPrice(850, "PKR")  -> "Rs 850"
 *   formatPrice(12.5, "USD") -> "$12.50"
 */
export function formatPrice(amount: number, currency: Currency): string {
  const minor = toMinorUnits(amount);
  const isWhole = minor % 100 === 0;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(minor) / 100);
  const sign = minor < 0 ? "-" : "";

  switch (currency) {
    case "USD":
      return `${sign}$${formatted}`;
    case "PKR":
    default:
      return `${sign}Rs ${formatted}`;
  }
}

export const CURRENCY_LABELS: Record<Currency, string> = {
  PKR: "Pakistani Rupee (Rs)",
  USD: "US Dollar ($)",
};
