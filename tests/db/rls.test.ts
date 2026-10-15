import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, describe, expect, it } from "vitest";

/*
 * Runs the real Supabase migration in PGlite (Postgres compiled to WASM) and
 * checks tenant isolation by switching between the `anon` and
 * `authenticated` roles exactly as PostgREST does.
 */

const root = path.join(__dirname, "../..");
const shim = fs.readFileSync(path.join(__dirname, "supabase-shim.sql"), "utf8");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20261015000000_initial_schema.sql"),
  "utf8",
);

const ALICE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BOB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

let db: PGlite;
let aliceRestaurant: string;
let bobRestaurant: string;
let aliceCategory: string;
let aliceItem: string;

/** Runs `sql` as the given API role (and user), like a PostgREST request. */
async function as<T = Record<string, unknown>>(
  role: "anon" | "authenticated",
  userId: string | null,
  sql: string,
  params: unknown[] = [],
) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
  await db.exec(`set role ${role}`);
  try {
    return await db.query<T>(sql, params);
  } finally {
    await db.exec("reset role");
  }
}

const asAlice = <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
  as<T>("authenticated", ALICE, sql, params);
const asBob = <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
  as<T>("authenticated", BOB, sql, params);
const asAnon = <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
  as<T>("anon", null, sql, params);

beforeAll(async () => {
  db = await PGlite.create({ extensions: { pgcrypto } });
  await db.exec(shim);
  await db.exec(migration);

  // Two owners sign up (the trigger creates their profiles).
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, 'alice@example.com', '{"full_name":"Alice"}'),
       ($2, 'bob@example.com', '{"full_name":"Bob"}')`,
    [ALICE, BOB],
  );

  const a = await asAlice<{ id: string }>(
    `insert into restaurants (owner_id, name, slug, whatsapp_number)
     values ($1, 'Alice Grill', 'alice-grill', '+923001234567') returning id`,
    [ALICE],
  );
  aliceRestaurant = a.rows[0]!.id;

  const b = await asBob<{ id: string }>(
    `insert into restaurants (owner_id, name, slug, whatsapp_number)
     values ($1, 'Bob Cafe', 'bob-cafe', '+14155550100') returning id`,
    [BOB],
  );
  bobRestaurant = b.rows[0]!.id;

  const c = await asAlice<{ id: string }>(
    `insert into menu_categories (restaurant_id, name) values ($1, 'Burgers') returning id`,
    [aliceRestaurant],
  );
  aliceCategory = c.rows[0]!.id;

  const i = await asAlice<{ id: string }>(
    `insert into menu_items (restaurant_id, category_id, name, price)
     values ($1, $2, 'Smash', 950) returning id`,
    [aliceRestaurant, aliceCategory],
  );
  aliceItem = i.rows[0]!.id;
}, 60_000);

describe("profiles", () => {
  it("creates a profile per signup and hides other profiles", async () => {
    const own = await asAlice<{ full_name: string }>("select full_name from profiles");
    expect(own.rows).toEqual([{ full_name: "Alice" }]);
    await expect(asAnon("select * from profiles")).rejects.toThrow(/permission denied/);
  });
});

describe("restaurants", () => {
  it("owners only see their own restaurant", async () => {
    const rows = await asBob<{ slug: string }>("select slug from restaurants");
    expect(rows.rows).toEqual([{ slug: "bob-cafe" }]);
  });

  it("cannot create a restaurant for someone else or mark it as demo", async () => {
    await expect(
      asBob(
        `insert into restaurants (owner_id, name, slug, whatsapp_number)
         values ($1, 'Hijack', 'hijack-x', '+14155550101')`,
        [ALICE],
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      asAlice(`update restaurants set is_demo = true where id = $1`, [aliceRestaurant]),
    ).rejects.toThrow(/row-level security/);
  });

  it("cannot update, transfer or delete another owner's restaurant", async () => {
    const upd = await asBob(`update restaurants set name = 'Pwned' where id = $1`, [aliceRestaurant]);
    expect(upd.affectedRows).toBe(0);
    const del = await asBob(`delete from restaurants where id = $1`, [aliceRestaurant]);
    expect(del.affectedRows).toBe(0);
    await expect(
      asAlice(`update restaurants set owner_id = $1 where id = $2`, [BOB, aliceRestaurant]),
    ).rejects.toThrow(/row-level security/);
  });

  it("enforces one restaurant per owner, unique and valid slugs, E.164 numbers", async () => {
    await expect(
      asAlice(
        `insert into restaurants (owner_id, name, slug, whatsapp_number) values ($1, 'Second', 'second-one', '+923001234567')`,
        [ALICE],
      ),
    ).rejects.toThrow(/duplicate key/);
    await expect(
      asAlice(`update restaurants set slug = 'bob-cafe' where id = $1`, [aliceRestaurant]),
    ).rejects.toThrow(/duplicate key/);
    await expect(
      asAlice(`update restaurants set slug = 'dashboard' where id = $1`, [aliceRestaurant]),
    ).rejects.toThrow(/restaurants_slug_not_reserved/);
    await expect(
      asAlice(`update restaurants set slug = 'Bad Slug' where id = $1`, [aliceRestaurant]),
    ).rejects.toThrow(/restaurants_slug_format/);
    await expect(
      asAlice(`update restaurants set whatsapp_number = '03001234567' where id = $1`, [aliceRestaurant]),
    ).rejects.toThrow(/whatsapp_number_check/);
    await expect(
      asAlice(
        `update restaurants set accepts_dine_in = false, accepts_takeaway = false, accepts_delivery = false where id = $1`,
        [aliceRestaurant],
      ),
    ).rejects.toThrow(/order_type_required/);
  });

  it("checks slug availability without exposing rows", async () => {
    const taken = await asBob<{ ok: boolean }>("select is_slug_available('alice-grill') as ok");
    expect(taken.rows[0]!.ok).toBe(false);
    const free = await asBob<{ ok: boolean }>("select is_slug_available('brand-new') as ok");
    expect(free.rows[0]!.ok).toBe(true);
    await expect(asAnon("select is_slug_available('x')")).rejects.toThrow(/permission denied/);
  });
});

describe("menu data", () => {
  it("other owners cannot read or modify a restaurant's categories and items", async () => {
    expect((await asBob("select * from menu_categories")).rows).toHaveLength(0);
    expect((await asBob("select * from menu_items")).rows).toHaveLength(0);
    expect(
      (await asBob(`update menu_items set price = 0 where id = $1`, [aliceItem])).affectedRows,
    ).toBe(0);
    expect(
      (await asBob(`delete from menu_categories where id = $1`, [aliceCategory])).affectedRows,
    ).toBe(0);
    await expect(
      asBob(`insert into menu_categories (restaurant_id, name) values ($1, 'Spam')`, [aliceRestaurant]),
    ).rejects.toThrow(/row-level security/);
  });

  it("an item cannot point at another restaurant's category", async () => {
    await expect(
      asBob(
        `insert into menu_items (restaurant_id, category_id, name, price) values ($1, $2, 'X', 1)`,
        [bobRestaurant, aliceCategory],
      ),
    ).rejects.toThrow(/menu_items_category_fkey/);
  });

  it("rejects negative prices and over-precise values are rounded to 2 decimals", async () => {
    await expect(
      asAlice(`update menu_items set price = -1 where id = $1`, [aliceItem]),
    ).rejects.toThrow(/price_check/);
    const r = await asAlice<{ price: string }>(
      `update menu_items set price = 12.345 where id = $1 returning price::text`,
      [aliceItem],
    );
    expect(r.rows[0]!.price).toBe("12.35");
    await asAlice(`update menu_items set price = 950 where id = $1`, [aliceItem]);
  });

  it("a category with items cannot be deleted", async () => {
    await expect(
      asAlice(`delete from menu_categories where id = $1`, [aliceCategory]),
    ).rejects.toThrow(/menu_items_category_fkey/);
  });

  it("caps categories per restaurant", async () => {
    await asBob(
      `insert into menu_categories (restaurant_id, name)
       select $1, 'Cat ' || g from generate_series(1, 50) g`,
      [bobRestaurant],
    );
    await expect(
      asBob(`insert into menu_categories (restaurant_id, name) values ($1, 'One too many')`, [bobRestaurant]),
    ).rejects.toThrow(/Category limit reached/);
    await asBob(`delete from menu_categories where restaurant_id = $1`, [bobRestaurant]);
  });
});

describe("public (anon) access", () => {
  it("can read published menus but not owner_id", async () => {
    const r = await asAnon<{ slug: string }>("select slug from restaurants order by slug");
    expect(r.rows.map((x) => x.slug)).toEqual(["alice-grill", "bob-cafe"]);
    await expect(asAnon("select owner_id from restaurants")).rejects.toThrow(/permission denied/);
    const items = await asAnon<{ name: string }>("select name from menu_items");
    expect(items.rows).toEqual([{ name: "Smash" }]);
  });

  it("can never write", async () => {
    await expect(
      asAnon(`update menu_items set price = 1 where id = $1`, [aliceItem]),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asAnon(`insert into menu_categories (restaurant_id, name) values ($1, 'x')`, [aliceRestaurant]),
    ).rejects.toThrow(/permission denied/);
    await expect(asAnon(`delete from restaurants`)).rejects.toThrow(/permission denied/);
  });

  it("cannot see unpublished menus", async () => {
    await asAlice(`update restaurants set is_published = false where id = $1`, [aliceRestaurant]);
    const r = await asAnon<{ slug: string }>("select slug from restaurants");
    expect(r.rows.map((x) => x.slug)).toEqual(["bob-cafe"]);
    expect((await asAnon("select * from menu_items")).rows).toHaveLength(0);
    expect((await asAnon("select * from menu_categories")).rows).toHaveLength(0);
    // The owner still sees everything.
    expect((await asAlice("select * from menu_items")).rows).toHaveLength(1);
    await asAlice(`update restaurants set is_published = true where id = $1`, [aliceRestaurant]);
  });
});

describe("storage", () => {
  it("owners can only upload into their own restaurant folder", async () => {
    await asAlice(
      `insert into storage.objects (bucket_id, name) values ('menu-images', $1)`,
      [`${aliceRestaurant}/item-1.webp`],
    );
    await expect(
      asAlice(`insert into storage.objects (bucket_id, name) values ('menu-images', $1)`, [
        `${bobRestaurant}/item-1.webp`,
      ]),
    ).rejects.toThrow(/row-level security/);
    await expect(
      asAlice(`insert into storage.objects (bucket_id, name) values ('menu-images', 'item-1.webp')`),
    ).rejects.toThrow(/row-level security/);
    const del = await asBob(`delete from storage.objects where name = $1`, [
      `${aliceRestaurant}/item-1.webp`,
    ]);
    expect(del.affectedRows).toBe(0);
  });

  it("configures the bucket with size and type limits", async () => {
    const b = await db.query<{ public: boolean; file_size_limit: number; allowed_mime_types: string[] }>(
      "select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'menu-images'",
    );
    expect(b.rows[0]).toEqual({
      public: true,
      file_size_limit: 2097152,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
    });
  });
});

describe("function privileges", () => {
  it.each([
    "select owns_restaurant(gen_random_uuid())",
    "select owns_storage_folder('x/y.webp')",
    "select is_slug_available('x')",
  ])("anon cannot call helper: %s", async (sql) => {
    await expect(asAnon(sql)).rejects.toThrow(/permission denied/);
  });

  it("anon can call the public visibility helper used by its own policies", async () => {
    const r = await asAnon<{ ok: boolean }>("select restaurant_is_public($1) as ok", [bobRestaurant]);
    expect(r.rows[0]!.ok).toBe(true);
  });
});
