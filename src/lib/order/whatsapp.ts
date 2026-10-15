import { formatPrice, fromMinorUnits } from "@/lib/money";
import { toWhatsAppDigits } from "@/lib/phone";
import type { Currency } from "@/types/database";
import type { PricedLine } from "./cart";

export type OrderType = "dine_in" | "takeaway" | "delivery";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "Dine-in",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

export type OrderMessageInput = {
  restaurantName: string;
  currency: Currency;
  lines: PricedLine[];
  subtotalMinor: number;
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  deliveryAddress?: string;
  notes?: string;
  isDemo?: boolean;
};

/** Strips characters that would break WhatsApp formatting or the layout. */
function clean(value: string | undefined, max: number): string {
  if (!value) return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ") // control chars incl. newlines
    .replace(/[*_~`]/g, "") // WhatsApp formatting markers
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, max);
}

/** Builds the human-readable order request the customer sends on WhatsApp. */
export function buildOrderMessage(input: OrderMessageInput): string {
  const price = (minor: number) =>
    formatPrice(fromMinorUnits(minor), input.currency);

  const out: string[] = [];
  out.push(`*New order request: ${clean(input.restaurantName, 80)}*`);
  if (input.isDemo) out.push("(Demo order: sample restaurant)");
  out.push("");

  let typeLine = `Order type: ${ORDER_TYPE_LABELS[input.orderType]}`;
  const table = clean(input.tableNumber, 10);
  if (input.orderType === "dine_in" && table) typeLine += ` (Table ${table})`;
  out.push(typeLine);

  const name = clean(input.customerName, 60);
  if (name) out.push(`Name: ${name}`);

  const address = clean(input.deliveryAddress, 200);
  if (input.orderType === "delivery" && address) {
    out.push(`Delivery address: ${address}`);
  }

  out.push("");
  out.push("*Items*");
  for (const line of input.lines) {
    out.push(
      `${line.quantity} x ${clean(line.name, 80)} = ${price(line.totalMinor)}`,
    );
  }
  out.push("");
  out.push(`*Subtotal: ${price(input.subtotalMinor)}*`);

  const notes = clean(input.notes, 300);
  if (notes) {
    out.push("");
    out.push(`Notes: ${notes}`);
  }

  out.push("");
  out.push(
    "Please confirm my order and let me know the final total and timing.",
  );
  return out.join("\n");
}

/**
 * Standard WhatsApp click-to-chat link. With no valid phone number the link
 * opens WhatsApp with the message prefilled and lets the user pick a chat.
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message: string,
): string {
  const digits = phone ? toWhatsAppDigits(phone) : null;
  const text = encodeURIComponent(message);
  return digits
    ? `https://wa.me/${digits}?text=${text}`
    : `https://wa.me/?text=${text}`;
}
