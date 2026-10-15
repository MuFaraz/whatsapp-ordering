import { describe, expect, it } from "vitest";
import { priceCart, sanitizeCart, type PriceableItem } from "@/lib/order/cart";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/order/whatsapp";

const menu = new Map<string, PriceableItem>([
  ["burger", { id: "burger", name: "Classic Smash", price: 950, is_available: true }],
  ["fries", { id: "fries", name: "Skin-on Fries", price: 390, is_available: true }],
  ["latte", { id: "latte", name: "Iced Latte", price: 4.75, is_available: true }],
  ["soldout", { id: "soldout", name: "Mango Cheesecake", price: 750, is_available: false }],
]);

describe("sanitizeCart", () => {
  it("merges duplicates, clamps quantities and drops zero lines", () => {
    expect(
      sanitizeCart([
        { itemId: "burger", quantity: 2 },
        { itemId: "burger", quantity: 1 },
        { itemId: "fries", quantity: 0 },
        { itemId: "latte", quantity: 999 },
        { itemId: "", quantity: 1 },
        { itemId: "x", quantity: -3 },
        { itemId: "y", quantity: 2.7 },
      ]),
    ).toEqual([
      { itemId: "burger", quantity: 3 },
      { itemId: "latte", quantity: 50 },
      { itemId: "y", quantity: 2 },
    ]);
  });
});

describe("priceCart", () => {
  it("prices from trusted menu data in minor units", () => {
    const priced = priceCart(
      [
        { itemId: "burger", quantity: 2 },
        { itemId: "fries", quantity: 1 },
      ],
      menu,
    );
    expect(priced.subtotalMinor).toBe(2 * 95000 + 39000);
    expect(priced.itemCount).toBe(3);
    expect(priced.lines[0]).toMatchObject({ name: "Classic Smash", unitMinor: 95000, totalMinor: 190000 });
  });

  it("avoids floating point errors with decimal prices", () => {
    const priced = priceCart([{ itemId: "latte", quantity: 3 }], menu);
    expect(priced.subtotalMinor).toBe(1425);
  });

  it("excludes unavailable and unknown items", () => {
    const priced = priceCart(
      [
        { itemId: "soldout", quantity: 1 },
        { itemId: "ghost", quantity: 1 },
        { itemId: "fries", quantity: 1 },
      ],
      menu,
    );
    expect(priced.lines.map((l) => l.itemId)).toEqual(["fries"]);
    expect(priced.unavailable).toEqual(["Mango Cheesecake"]);
    expect(priced.missing).toEqual(["ghost"]);
    expect(priced.subtotalMinor).toBe(39000);
  });
});

describe("WhatsApp message", () => {
  const priced = priceCart(
    [
      { itemId: "burger", quantity: 2 },
      { itemId: "fries", quantity: 1 },
    ],
    menu,
  );

  it("formats a readable order", () => {
    const message = buildOrderMessage({
      restaurantName: "Bun & Brew Café",
      currency: "PKR",
      lines: priced.lines,
      subtotalMinor: priced.subtotalMinor,
      orderType: "dine_in",
      tableNumber: "7",
      customerName: "Ayesha",
      notes: "No onions please",
    });
    expect(message).toContain("*New order request: Bun & Brew Café*");
    expect(message).toContain("Order type: Dine-in (Table 7)");
    expect(message).toContain("Name: Ayesha");
    expect(message).toContain("2 x Classic Smash = Rs 1,900");
    expect(message).toContain("1 x Skin-on Fries = Rs 390");
    expect(message).toContain("*Subtotal: Rs 2,290*");
    expect(message).toContain("Notes: No onions please");
  });

  it("only shows the table for dine-in and the address for delivery", () => {
    const takeaway = buildOrderMessage({
      restaurantName: "R",
      currency: "USD",
      lines: priced.lines,
      subtotalMinor: priced.subtotalMinor,
      orderType: "takeaway",
      tableNumber: "7",
      deliveryAddress: "12 Street",
    });
    expect(takeaway).toContain("Order type: Takeaway");
    expect(takeaway).not.toContain("Table");
    expect(takeaway).not.toContain("12 Street");

    const delivery = buildOrderMessage({
      restaurantName: "R",
      currency: "USD",
      lines: priced.lines,
      subtotalMinor: priced.subtotalMinor,
      orderType: "delivery",
      deliveryAddress: "12 Street",
    });
    expect(delivery).toContain("Delivery address: 12 Street");
  });

  it("strips control characters and formatting markers from customer input", () => {
    const message = buildOrderMessage({
      restaurantName: "R",
      currency: "PKR",
      lines: priced.lines,
      subtotalMinor: priced.subtotalMinor,
      orderType: "takeaway",
      customerName: "*Bold*\nInjected line",
      notes: "_x_ ~y~ `z`",
    });
    expect(message).toContain("Name: Bold Injected line");
    expect(message).toContain("Notes: x y z");
  });

  it("builds an encoded click-to-chat URL", () => {
    const url = buildWhatsAppUrl("+92 300 1234567", "Hi & bye\n2 x Fries = Rs 390 #1");
    expect(url).toBe(
      "https://wa.me/923001234567?text=Hi%20%26%20bye%0A2%20x%20Fries%20%3D%20Rs%20390%20%231",
    );
    expect(decodeURIComponent(new URL(url).searchParams.get("text")!)).toBe(
      "Hi & bye\n2 x Fries = Rs 390 #1",
    );
  });

  it("falls back to the contact picker without a valid number", () => {
    expect(buildWhatsAppUrl(null, "x")).toBe("https://wa.me/?text=x");
    expect(buildWhatsAppUrl("0300-invalid", "x")).toBe("https://wa.me/?text=x");
  });
});
