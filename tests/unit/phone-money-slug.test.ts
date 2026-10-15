import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatPrice, toMinorUnits } from "@/lib/money";
import { normalizePhoneNumber, toWhatsAppDigits } from "@/lib/phone";
import { getSlugProblem, RESERVED_SLUGS, slugify } from "@/lib/slug";

describe("normalizePhoneNumber", () => {
  it.each([
    ["+92 300 1234567", "+923001234567"],
    ["+92-300-123-4567", "+923001234567"],
    ["0092 300 1234567", "+923001234567"],
    ["(+1) 415 555 0100", "+14155550100"],
    ["+44 20 7946 0958", "+442079460958"],
  ])("normalises %s", (input, expected) => {
    expect(normalizePhoneNumber(input)).toBe(expected);
  });

  it.each([
    "03001234567", // local number without country code
    "+0 300 1234567", // country code can't start with 0
    "+92 300",
    "+92 300 1234567 ext 5",
    "+92+3001234567",
    "abc",
    "",
    "+1234567890123456", // 16 digits: too long for E.164
  ])("rejects %s", (input) => {
    expect(normalizePhoneNumber(input)).toBeNull();
  });

  it("builds wa.me digits without +", () => {
    expect(toWhatsAppDigits("+92 300 1234567")).toBe("923001234567");
    expect(toWhatsAppDigits("0300")).toBeNull();
  });
});

describe("money", () => {
  it("converts to minor units without float drift", () => {
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
    expect(toMinorUnits(19.99)).toBe(1999);
    expect(toMinorUnits(1150)).toBe(115000);
  });

  it("formats PKR and USD", () => {
    expect(formatPrice(850, "PKR")).toBe("Rs 850");
    expect(formatPrice(1350, "PKR")).toBe("Rs 1,350");
    expect(formatPrice(12.5, "USD")).toBe("$12.50");
    expect(formatPrice(0, "USD")).toBe("$0");
    expect(formatPrice(1000000, "PKR")).toBe("Rs 1,000,000");
  });
});

describe("slug", () => {
  it("slugifies restaurant names", () => {
    expect(slugify("Bun & Brew Café")).toBe("bun-and-brew-cafe");
    expect(slugify("  Karachi   Grill!! House ")).toBe("karachi-grill-house");
    expect(slugify("---")).toBe("");
    expect(slugify("a".repeat(80)).length).toBeLessThanOrEqual(48);
  });

  it("validates format and reserved words", () => {
    expect(getSlugProblem("karachi-grill")).toBeNull();
    expect(getSlugProblem("ab")).toBe("format");
    expect(getSlugProblem("-start")).toBe("format");
    expect(getSlugProblem("end-")).toBe("format");
    expect(getSlugProblem("double--hyphen")).toBe("format");
    expect(getSlugProblem("Upper")).toBe("format");
    expect(getSlugProblem("dashboard")).toBe("reserved");
    expect(getSlugProblem("bun-and-brew-demo")).toBe("reserved");
  });

  it("keeps the reserved list in sync with the SQL constraint", () => {
    const sql = fs.readFileSync(
      path.join(__dirname, "../../supabase/migrations/20261015000000_initial_schema.sql"),
      "utf8",
    );
    const block = sql.match(/slug not in \(([\s\S]*?)\)/)?.[1] ?? "";
    const sqlSlugs = new Set([...block.matchAll(/'([^']+)'/g)].map((m) => m[1]));
    expect(sqlSlugs).toEqual(RESERVED_SLUGS);
  });
});
