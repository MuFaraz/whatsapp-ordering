"use server";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getPublicMenu } from "@/lib/data/menu";
import { priceCart, type PricedLine } from "@/lib/order/cart";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/order/whatsapp";
import { normalizePhoneNumber } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request.server";
import { fieldErrorsOf, orderRequestSchema } from "@/lib/validation";

export type PreparedOrder = {
  message: string;
  whatsappUrl: string;
  /** False when the restaurant's number is missing/invalid (demo w/o number). */
  hasRecipient: boolean;
  lines: PricedLine[];
  subtotalMinor: number;
  /** Items removed from the order because they're no longer available. */
  removed: string[];
};

/**
 * Re-prices the cart from the database (never trusting client prices), checks
 * the order options against the restaurant's settings and builds the
 * WhatsApp click-to-chat link. Nothing is sent: the customer reviews the
 * message and sends it themselves in WhatsApp.
 */
export async function prepareWhatsAppOrderAction(
  input: unknown,
): Promise<ActionResult<PreparedOrder>> {
  const ip = await getClientIp();
  if (!rateLimit(`order:${ip}`, 20, 60 * 1000).allowed) {
    return fail("Too many requests. Please wait a moment and try again.");
  }

  const parsed = orderRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please check your order details.", fieldErrorsOf(parsed.error));
  }
  const order = parsed.data;

  const menu = await getPublicMenu(order.slug);
  if (!menu) return fail("This menu is not available right now.");
  const { restaurant } = menu;

  const allowedTypes = {
    dine_in: restaurant.accepts_dine_in,
    takeaway: restaurant.accepts_takeaway,
    delivery: restaurant.accepts_delivery,
  };
  if (!allowedTypes[order.orderType]) {
    return fail("This order type isn't available. Please choose another.", {
      orderType: "Not available",
    });
  }
  if (order.orderType === "delivery" && !order.deliveryAddress) {
    return fail("Please add your delivery address.", {
      deliveryAddress: "Enter your delivery address",
    });
  }

  const itemsById = new Map(menu.items.map((item) => [item.id, item]));
  const priced = priceCart(order.lines, itemsById);

  if (priced.lines.length === 0) {
    return fail(
      priced.unavailable.length > 0
        ? "The items in your cart are no longer available."
        : "Your cart is empty.",
    );
  }

  const message = buildOrderMessage({
    restaurantName: restaurant.name,
    currency: restaurant.currency,
    lines: priced.lines,
    subtotalMinor: priced.subtotalMinor,
    orderType: order.orderType,
    tableNumber: restaurant.table_number_enabled ? order.tableNumber : undefined,
    customerName: order.customerName,
    deliveryAddress: order.deliveryAddress,
    notes: order.notes,
    isDemo: restaurant.is_demo,
  });

  const recipient = menu.orderPhone ? normalizePhoneNumber(menu.orderPhone) : null;
  if (!recipient && !restaurant.is_demo) {
    return fail(
      "This restaurant hasn't set up WhatsApp ordering yet. Please order with the staff.",
    );
  }

  return ok({
    message,
    whatsappUrl: buildWhatsAppUrl(recipient, message),
    hasRecipient: recipient !== null,
    lines: priced.lines,
    subtotalMinor: priced.subtotalMinor,
    removed: priced.unavailable,
  });
}
