import { afterEach, describe, expect, it } from "vitest";
import { buildMenuUrl, resolveAppUrl } from "@/lib/app-url";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";
import { ownedObjectPath } from "@/lib/storage";
import {
  menuItemSchema,
  orderRequestSchema,
  resetPasswordSchema,
  restaurantCreateSchema,
  restaurantSettingsSchema,
} from "@/lib/validation";

describe("resolveAppUrl", () => {
  it("prefers NEXT_PUBLIC_APP_URL and strips trailing slashes", () => {
    expect(resolveAppUrl({ explicit: "https://menu.example.com/" })).toBe("https://menu.example.com");
  });

  it("uses the Vercel production URL when no explicit URL is set", () => {
    expect(
      resolveAppUrl({ vercelEnv: "production", vercelProductionUrl: "bunbrew.vercel.app", vercelUrl: "bunbrew-abc123.vercel.app" }),
    ).toBe("https://bunbrew.vercel.app");
  });

  it("uses the deployment URL on previews", () => {
    expect(resolveAppUrl({ vercelEnv: "preview", vercelUrl: "bunbrew-git-x.vercel.app" })).toBe(
      "https://bunbrew-git-x.vercel.app",
    );
  });

  it("never returns localhost on Vercel, even if misconfigured", () => {
    expect(
      resolveAppUrl({
        explicit: "http://localhost:3000",
        vercelEnv: "production",
        vercelProductionUrl: "bunbrew.vercel.app",
      }),
    ).toBe("https://bunbrew.vercel.app");
    expect(
      resolveAppUrl({ vercelEnv: "production", requestOrigin: "http://localhost:3000" }),
    ).toBe("");
  });

  it("falls back to the request origin, then localhost in development", () => {
    expect(resolveAppUrl({ requestOrigin: "https://abc.ngrok.app" })).toBe("https://abc.ngrok.app");
    expect(resolveAppUrl({})).toBe("http://localhost:3000");
  });

  it("builds menu URLs", () => {
    expect(buildMenuUrl("https://x.vercel.app/", "karachi-grill")).toBe(
      "https://x.vercel.app/menu/karachi-grill",
    );
  });
});

describe("ownedObjectPath", () => {
  const base = "https://abc.supabase.co";
  const rid = "11111111-1111-4111-8111-111111111111";
  const prefix = `${base}/storage/v1/object/public/menu-images/`;

  it("accepts images in the restaurant's own folder", () => {
    expect(ownedObjectPath(`${prefix}${rid}/item-1a2b.webp`, base, rid)).toBe(`${rid}/item-1a2b.webp`);
  });

  it.each([
    `${prefix}22222222-2222-4222-8222-222222222222/item-1.webp`, // another tenant
    `https://evil.example.com/${rid}/item.webp`, // external host
    `${prefix}${rid}/../other/item.webp`, // traversal
    `${prefix}${rid}/nested/item.webp`,
    `${prefix}${rid}/item.svg`, // disallowed type
    `${prefix}${rid}/item.webp?x=1`,
  ])("rejects %s", (url) => {
    expect(ownedObjectPath(url, base, rid)).toBeNull();
  });
});

describe("rateLimit", () => {
  afterEach(() => resetRateLimits());

  it("blocks after the limit within the window and resets after it", () => {
    const now = 1_000_000;
    expect(rateLimit("k", 2, 1000, now).allowed).toBe(true);
    expect(rateLimit("k", 2, 1000, now + 1).allowed).toBe(true);
    expect(rateLimit("k", 2, 1000, now + 2).allowed).toBe(false);
    expect(rateLimit("k", 2, 1000, now + 1001).allowed).toBe(true);
    expect(rateLimit("other", 2, 1000, now + 2).allowed).toBe(true);
  });
});

describe("validation schemas", () => {
  it("validates restaurant creation", () => {
    expect(
      restaurantCreateSchema.safeParse({
        name: "Karachi Grill",
        slug: "karachi-grill",
        whatsappNumber: "+92 300 1234567",
        currency: "PKR",
      }).success,
    ).toBe(true);
    const bad = restaurantCreateSchema.safeParse({
      name: "K",
      slug: "admin",
      whatsappNumber: "03001234567",
      currency: "EUR",
    });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues.map((i) => i.path[0]).sort()).toEqual(
      ["currency", "name", "slug", "whatsappNumber"].sort(),
    );
  });

  it.each([
    ["850", true],
    ["12.50", true],
    ["0", true],
    ["1000000", true],
    ["1000000.01", false],
    ["-5", false],
    ["12.345", false],
    ["1e3", false],
    ["abc", false],
    ["", false],
  ])("price %s valid=%s", (price, valid) => {
    const result = menuItemSchema.safeParse({
      name: "Item",
      description: "",
      price,
      categoryId: "c1",
      isAvailable: true,
      imageUrl: null,
    });
    expect(result.success).toBe(valid);
  });

  it("requires at least one order type in settings", () => {
    const base = {
      name: "R R",
      slug: "rr-cafe",
      description: "",
      whatsappNumber: "+14155550100",
      contactPhone: "",
      contactEmail: "",
      address: "",
      currency: "USD",
      isPublished: true,
      acceptsDineIn: false,
      acceptsTakeaway: false,
      acceptsDelivery: false,
      tableNumberEnabled: true,
      logoUrl: null,
      coverUrl: null,
    };
    expect(restaurantSettingsSchema.safeParse(base).success).toBe(false);
    expect(restaurantSettingsSchema.safeParse({ ...base, acceptsTakeaway: true }).success).toBe(true);
    expect(
      restaurantSettingsSchema.safeParse({ ...base, acceptsTakeaway: true, contactEmail: "nope" }).success,
    ).toBe(false);
  });

  it("rejects malformed orders (empty, oversized, fractional quantities)", () => {
    const ok = {
      slug: "x",
      lines: [{ itemId: "a", quantity: 2 }],
      orderType: "takeaway",
      tableNumber: "",
      customerName: "",
      deliveryAddress: "",
      notes: "",
    };
    expect(orderRequestSchema.safeParse(ok).success).toBe(true);
    expect(orderRequestSchema.safeParse({ ...ok, lines: [] }).success).toBe(false);
    expect(orderRequestSchema.safeParse({ ...ok, lines: [{ itemId: "a", quantity: 1.5 }] }).success).toBe(false);
    expect(orderRequestSchema.safeParse({ ...ok, lines: [{ itemId: "a", quantity: 51 }] }).success).toBe(false);
    expect(orderRequestSchema.safeParse({ ...ok, notes: "x".repeat(301) }).success).toBe(false);
    expect(orderRequestSchema.safeParse({ ...ok, orderType: "drive_thru" }).success).toBe(false);
    // Client-supplied prices are simply not part of the schema.
    const withPrice = orderRequestSchema.parse({ ...ok, lines: [{ itemId: "a", quantity: 1, price: 0 }] });
    expect(withPrice.lines[0]).toEqual({ itemId: "a", quantity: 1 });
  });
});

describe("password reset schema", () => {
  it("requires matching passwords of at least 8 characters", () => {
    expect(resetPasswordSchema.safeParse({ password: "longenough", confirmPassword: "longenough" }).success).toBe(true);
    const short = resetPasswordSchema.safeParse({ password: "short", confirmPassword: "short" });
    expect(short.success).toBe(false);
    const mismatch = resetPasswordSchema.safeParse({ password: "longenough", confirmPassword: "different1" });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});
