import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Static guards for tenant-security rules that are easy to break by accident
 * in future edits. They read the source, so they need no database.
 */

const root = path.join(__dirname, "../..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
const actionsDir = path.join(root, "src/lib/actions");

/** Actions that are public by design (no signed-in owner required). */
const PUBLIC_ACTION_FILES = new Set(["auth.ts", "order.ts"]);
const OWNER_GUARDS = /\b(requireOwner|ownerWithLimit|requireUser)\(/;

function serverActionFiles() {
  return fs
    .readdirSync(actionsDir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => ({ file: f, src: fs.readFileSync(path.join(actionsDir, f), "utf8") }))
    .filter(({ src }) => /^["']use server["'];/.test(src.trimStart()));
}

/** Splits a module into its exported async function bodies. */
function exportedFunctions(src: string) {
  const starts = [...src.matchAll(/^export async function (\w+)/gm)];
  return starts.map((m, i) => ({
    name: m[1]!,
    body: src.slice(m.index!, starts[i + 1]?.index ?? src.length),
  }));
}

describe("owner Server Actions", () => {
  const ownerFiles = serverActionFiles().filter(({ file }) => !PUBLIC_ACTION_FILES.has(file));

  it("finds the owner action files", () => {
    expect(ownerFiles.map((f) => f.file).sort()).toEqual(
      ["categories.ts", "items.ts", "restaurant.ts", "uploads.ts"].sort(),
    );
  });

  for (const { file, src } of ownerFiles) {
    for (const fn of exportedFunctions(src)) {
      it(`${file} › ${fn.name} verifies the session before touching data`, () => {
        const guard = fn.body.search(OWNER_GUARDS);
        const firstQuery = fn.body.search(/supabase\s*\.\s*(from|rpc|storage)|createClient\(/);
        expect(guard, "missing requireOwner/requireUser").toBeGreaterThan(-1);
        if (firstQuery > -1) expect(guard).toBeLessThan(firstQuery);
      });
    }

    it(`${file}: every update/delete is scoped to the owner's restaurant`, () => {
      // Each query chain runs from `.from("table")` to the end of the statement.
      const chains = src.match(/\.from\("(?:menu_items|menu_categories|restaurants)"\)[\s\S]*?;/g) ?? [];
      const writes = chains.filter((c) => /\.(update|delete)\(/.test(c));
      for (const chain of writes) {
        const scoped =
          chain.includes('.eq("restaurant_id", restaurant.id)') ||
          (chain.includes('.from("restaurants")') && chain.includes('.eq("id", restaurant.id)'));
        expect(scoped, `unscoped write:\n${chain}`).toBe(true);
      }
    });

    it(`${file}: restaurant_id / owner_id only come from the session`, () => {
      for (const m of src.matchAll(/\brestaurant_id:\s*([^,\n}]+)/g)) {
        expect(m[1]!.trim()).toBe("restaurant.id");
      }
      for (const m of src.matchAll(/\bowner_id:\s*([^,\n}]+)/g)) {
        expect(m[1]!.trim()).toBe("user.id");
      }
    });
  }
});

describe("public menu reads", () => {
  it("select exactly the columns granted to anon in SQL", () => {
    const sql = read("supabase/migrations/20261015000000_initial_schema.sql");
    const grant = sql.match(/grant select \(([\s\S]*?)\) on public\.restaurants to anon/)?.[1];
    const code = read("src/lib/data/menu.ts").match(/PUBLIC_RESTAURANT_COLUMNS =\s*"([^"]+)"/)?.[1];
    const cols = (s?: string) => (s ?? "").split(",").map((c) => c.trim()).filter(Boolean).sort();
    expect(cols(code)).toEqual(cols(grant));
    expect(cols(code)).not.toContain("owner_id");
  });

  it("use the cookie-less anon client", () => {
    const src = read("src/lib/data/menu.ts");
    expect(src).toContain("createPublicClient()");
    expect(src).not.toMatch(/\bcreateClient\(/);
  });
});

describe("secrets", () => {
  function walk(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
  }

  it("no service-role/secret keys are referenced in app code", () => {
    for (const file of walk(path.join(root, "src"))) {
      const src = fs.readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/service_role|SERVICE_ROLE|SUPABASE_SECRET|sb_secret_/);
    }
  });
});
