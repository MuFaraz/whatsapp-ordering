# Bun & Brew Menu

A multi-tenant SaaS for restaurants: each restaurant builds a digital menu, prints a QR code for its tables, and customers send their order to the restaurant's WhatsApp. No apps, no commission, no payment processing, no WhatsApp Business API.

> "Bun & Brew Menu" is temporary branding. Change it in [src/config/site.ts](src/config/site.ts).

**Stack:** Next.js 16 (App Router, Server Actions, `proxy.ts`), TypeScript (strict), Tailwind CSS v4, shadcn/ui (Radix), Supabase (Postgres + Auth + Storage), React Hook Form + Zod, `qrcode`, Lucide, Vitest + PGlite. Deploys to Vercel.

---

## Contents

1. [What's included](#whats-included)
2. [Architecture & security](#architecture--security)
3. [Local setup](#local-setup)
4. [Supabase setup](#supabase-setup)
5. [Deploy to Vercel](#deploy-to-vercel)
6. [Testing the deployment](#testing-the-deployment)
7. [Demo mode](#demo-mode)
8. [Scripts & tests](#scripts--tests)
9. [Free-tier limits & production checklist](#free-tier-limits--production-checklist)
10. [Known limitations](#known-limitations)
11. [Verification status](#verification-status)

---

## What's included

| Route | Purpose |
| --- | --- |
| `/` | Landing page: benefits, how it works, live demo + scannable QR, features, pricing, FAQ, contact CTA |
| `/pricing` | Pricing (Starter PKR 1,000/month, setup assistance, custom website) |
| `/demo` | Demo hub: "Try live menu" and "Explore dashboard demo" |
| `/menu/bun-and-brew-demo` | Fully populated fictional demo restaurant (works without a database) |
| `/demo/dashboard/*` | Sandbox owner dashboard with sample data. Edits stay in the browser, never saved |
| `/signup`, `/login` | Owner registration / login (email + password, email verification supported) |
| `/forgot-password`, `/reset-password` | Password reset by email (doesn't reveal whether an email has an account) |
| `/auth/confirm` | Email verification callback (`code` and `token_hash` flows) |
| `/onboarding` | Name & link → WhatsApp → currency → optional logo & description |
| `/dashboard` | Overview: categories, items, available items, public menu status, quick actions, setup checklist, recent changes |
| `/dashboard/menu` | Item CRUD, image upload, availability toggle, live preview, search & filters, reordering within a category |
| `/dashboard/categories` | Category CRUD, reordering, safe delete (move or delete items) |
| `/dashboard/qr-code` | QR preview, PNG/SVG download, link copy, printing tips |
| `/dashboard/qr-code/print` | Printable table cards (1 or 4 per page) |
| `/dashboard/settings` | Profile, logo/cover, link, publish toggle, WhatsApp number, currency, order types, table numbers, contact details |
| `/menu/[slug]` | Public, mobile-first menu with category nav, cart, order form and WhatsApp hand-off |
| `/robots.txt`, `/sitemap.xml` | Marketing pages indexable; dashboards, onboarding and demo dashboard excluded |
| Link preview | Branded 1200×630 Open Graph image for the marketing pages (shown when the URL is shared on WhatsApp). Restaurant menus use their own cover photo |

### WhatsApp ordering flow

1. The customer adds available items to the cart (stored in `localStorage` as item ids + quantities only).
2. They choose dine-in / takeaway / delivery (only types the restaurant enabled), optionally a table number, name, address (required for delivery) and notes.
3. **Order on WhatsApp** calls a Server Action that reloads the menu from the database, **re-prices the cart from trusted data** (client prices are never accepted), drops unavailable items, validates the order type against restaurant settings and builds the message.
4. The customer sees the exact message and a clear notice that the order **isn't confirmed until the restaurant replies**.
5. **Open WhatsApp to send** is a normal link to `https://wa.me/<digits>?text=<encoded message>`. WhatsApp opens with the message prefilled and the customer presses Send themselves. Nothing is sent automatically.

---

## Architecture & security

```
src/
  app/                 routes (marketing, auth, onboarding, dashboard, demo, menu)
  components/          ui/ (shadcn), dashboard/, menu/, marketing/, form/
  lib/
    actions/           Server Actions (auth, restaurant, categories, items, order)
    auth/dal.ts        Data Access Layer: getCurrentUser / requireOwner
    data/              read queries (public menu via anon client, owner menu)
    supabase/          server, browser and cookie-less public clients
    order/             cart pricing + WhatsApp message/URL builders (pure, tested)
    validation.ts      Zod schemas shared by forms and Server Actions
  proxy.ts             session refresh + optimistic redirects (Next 16 "middleware")
supabase/migrations/   SQL schema, RLS policies, storage bucket & policies
tests/unit, tests/db   Vitest unit tests and PGlite database/RLS tests
```

**Tenant isolation is enforced in Postgres, not just the UI:**

- RLS is enabled on `profiles`, `restaurants`, `menu_categories`, `menu_items` and `storage.objects`.
- Owners (`authenticated`) can only select/insert/update/delete rows of the restaurant whose `owner_id = auth.uid()`. They can't create restaurants for others, transfer ownership, or set `is_demo`.
- Visitors (`anon`) can only **read** published restaurants and their menus. All writes are revoked from `anon`, and the `owner_id` column is not granted to `anon`.
- `menu_items (category_id, restaurant_id)` has a composite foreign key, so an item can never reference another restaurant's category. `ON DELETE RESTRICT` blocks deleting a category that still has items.
- CHECK constraints cover slug format and reserved words, E.164 WhatsApp numbers, non-negative prices (`numeric(12,2)`), text lengths, currency, and "at least one order type".
- Abuse caps (enforced by triggers): 50 categories and 500 items per restaurant.
- Storage: bucket `menu-images` is public-read with a **2 MB limit and JPEG/PNG/WebP only, enforced by Supabase**. Uploads are only allowed into a folder named after a restaurant the user owns. Images are resized and compressed in the browser before upload. Photos uploaded during an edit but never saved (dialog cancelled, or replaced before saving) are deleted again; the cleanup action only removes files in the owner's own folder that no menu row references.

**In the app:**

- Every protected page and Server Action calls `requireOwner()`, which verifies the user with `supabase.auth.getUser()`. The restaurant id always comes from the session, never from the client. Server Actions re-validate input with Zod. Image URLs are accepted only if they point into the owner's own storage folder. The proxy redirect is a convenience, not the security boundary.
- Public menus are read with a **cookie-less anon client**, so they show exactly what a customer can see.
- Only the publishable (anon) key is used. **No service-role/secret key exists anywhere in the app.**
- Rate limits (in-memory, per server instance): sign-up, login, verification resend, slug checks, menu writes, order preparation. Supabase Auth applies its own limits too.
- Security headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`. `poweredByHeader` is off. Login redirects only accept same-site relative paths.

---

## Local setup

Requirements: Node.js 20.9+ (tested on 23), npm, a free Supabase project (for accounts; the demo works without one).

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

Without Supabase variables the landing page, pricing, demo menu and demo dashboard all work. Account pages show a "Setup required" message.

> **Windows note:** if the project folder contains `&` (like `QR Menu & WhatsApp Ordering SaaS`), npm's `.cmd` shims break. The npm scripts in this repo call each tool through `node node_modules/...` to avoid that, so use `npm run <script>` rather than `npx next ...`. Renaming the folder (e.g. `bun-brew-menu`) also fixes it.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes (for accounts) | Project URL, e.g. `https://abcd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes (for accounts) | New-style publishable key `sb_publishable_...` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | alternative | Legacy JWT anon key (used only if the publishable key is not set) |
| `NEXT_PUBLIC_APP_URL` | recommended | Public base URL without trailing slash. Used for QR codes and auth emails |
| `NEXT_PUBLIC_DEMO_WHATSAPP_NUMBER` | optional | Your number (e.g. `+923001234567`) so demo orders arrive on your phone during sales demos |
| `NEXT_PUBLIC_SALES_WHATSAPP_NUMBER` | optional | Shows "Get started on WhatsApp" / contact buttons on landing & pricing |
| `NEXT_PUBLIC_CONTACT_EMAIL` | optional | Shows email contact links |

**Supabase key conventions:** new projects provide a *publishable key* (`sb_publishable_…`) and a *secret key* (`sb_secret_…`), replacing the legacy `anon` and `service_role` JWT keys. This app only needs the publishable key (or legacy anon key). Never put the secret/service-role key in this project.

**How the app URL is resolved** ([src/lib/app-url.ts](src/lib/app-url.ts)): `NEXT_PUBLIC_APP_URL` → Vercel production URL (`VERCEL_PROJECT_PRODUCTION_URL`) → deployment URL (`VERCEL_URL`) → the request's own host → `http://localhost:3000` locally. On Vercel a `localhost` value is always ignored, so production QR codes can't point to localhost. If `NEXT_PUBLIC_APP_URL` isn't set, the free `*.vercel.app` domain is used automatically.

---

## Supabase setup

1. **Create a project** at [supabase.com](https://supabase.com) (free plan). Pick a region near your customers.
2. **Apply the migration** (either option):
   - **SQL Editor (simplest):** open *SQL Editor → New query*, paste the whole of [`supabase/migrations/20261015000000_initial_schema.sql`](supabase/migrations/20261015000000_initial_schema.sql) and click **Run**. It creates the tables, constraints, triggers, RLS policies, the `menu-images` bucket and the storage policies.
   - **Supabase CLI:** `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`.
3. **Get keys:** *Project Settings → API Keys*. Copy the **Publishable key** and the project URL into `.env.local`.
4. **Configure Auth** (*Authentication → URL Configuration*):
   - **Site URL:** `http://localhost:3000` while developing, later your Vercel URL (e.g. `https://bun-brew-menu.vercel.app`).
   - **Redirect URLs:** add `http://localhost:3000/**` and `https://<your-app>.vercel.app/**` (plus `https://*-<your-team>.vercel.app/**` if you test preview deployments).
5. **Email verification** (*Authentication → Sign In / Providers → Email*):
   - **"Confirm email" ON (recommended):** after sign-up the UI shows "Check your email" with a resend button. Logging in unverified shows a clear message with a resend link. The link lands on `/auth/confirm` and continues to onboarding.
   - For links that also work when opened on a *different device*, change the **Confirm signup** email template (*Authentication → Emails*) to:
     ```html
     <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding">Confirm your email</a>
     ```
     The default template also works, but only in the same browser that signed up (PKCE).
   - For password reset links that work across devices, change the **Reset Password** template similarly:
     ```html
     <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset your password</a>
     ```
   - **"Confirm email" OFF:** users go straight to onboarding after sign-up (handy for quick demos).
   - Supabase's built-in email sender is heavily rate-limited (a few emails per hour). Before real customers, set up custom SMTP (*Project Settings → Auth → SMTP*), e.g. Resend or Brevo free tiers.
6. **Storage:** the migration creates the `menu-images` bucket. Check that it exists under *Storage* and is public, with a 2 MB size limit and image MIME types.

### Creating a real restaurant / owner account

Sign up at `/signup`, verify the email and complete onboarding. You can use this as your own showcase restaurant: add a menu and point `NEXT_PUBLIC_DEMO_WHATSAPP_NUMBER` at your phone. To set up a restaurant on a client's behalf, create the account with *their* email so they own it. There's no admin impersonation, by design.

---

## Deploy to Vercel

1. **Create a GitHub repo** and push:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<you>/bun-brew-menu.git
   git push -u origin main
   ```
   `.env*` files are git-ignored (except `.env.example`).
2. In [vercel.com](https://vercel.com) choose **Add New → Project**, import the repo. The framework is detected as Next.js; keep the default build settings.
3. **Environment variables** (*Settings → Environment Variables*), for Production (and Preview if you like):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://<your-project>.vercel.app` (Production only; previews fall back to their own URL)
   - optional: `NEXT_PUBLIC_DEMO_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SALES_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL`
4. **Deploy.** `NEXT_PUBLIC_*` values are baked in at build time, so **redeploy after changing them**. The build command is the default `npm run build`; no `vercel.json` is needed.

   Alternatively, from your machine with the [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`, `vercel link`, `vercel env add NEXT_PUBLIC_SUPABASE_URL` (repeat per variable), then `vercel --prod`.
5. Back in Supabase, set **Site URL** and **Redirect URLs** to the Vercel domain (step 4 of Supabase setup).

No custom domain is required. Everything works on `*.vercel.app`.

---

## Testing the deployment

1. Open `https://<app>.vercel.app/demo`, scan the QR code with your phone, add items and tap **Order on WhatsApp**. Check that the message is right and WhatsApp opens.
2. Sign up with a real email, verify it and complete onboarding (use your own WhatsApp number).
3. Add 2 categories and a few items with photos, then mark one item unavailable.
4. Open **QR code**. The link shown must be `https://<app>.vercel.app/menu/<slug>`, not localhost. Scan it with your phone and place a test order to yourself.
5. Print the table cards from **Printable table cards** (A4, 100% scale, background graphics on).
6. Isolation check: sign up a second account in a private window. It must not see the first restaurant's data, and the first restaurant's public menu must still work.
7. Toggle **Menu is public** off and confirm `/menu/<slug>` shows "This menu isn't available".

### Placing QR codes in a restaurant

Print the cards on thick paper or card, laminate them or use acrylic table stands, and keep the code at least 3 × 3 cm. Put one on each table, at the counter/entrance and on takeaway bags. Menu changes appear instantly. Only changing the menu link (slug) requires reprinting.

---

## Demo mode

- **Customer demo** (`/menu/bun-and-brew-demo`): a fictional "Bun & Brew Café" with 5 categories and 18 items (2 sold out), original SVG illustrations in `public/images/demo` (no third-party images or fragile URLs), and a "Demo menu" banner. Orders go to `NEXT_PUBLIC_DEMO_WHATSAPP_NUMBER` if set; otherwise WhatsApp opens with the message and lets the user choose a chat. The message is labelled as a demo order.
- **Dashboard demo** (`/demo/dashboard`): the real dashboard components running against built-in sample data with an in-browser "operations" implementation. Add/edit/delete/reorder/upload all work and validate with the same Zod schemas, but nothing is sent to a server or database, and everything resets on reload. There are no demo credentials, no login and no privileged access.
- The demo data lives in code ([src/lib/demo-data.ts](src/lib/demo-data.ts)), so the demo works even without Supabase. The demo slug is reserved in the database so no real restaurant can claim it.

---

## Scripts & tests

```bash
npm run dev         # development server
npm run build       # production build
npm start           # serve the production build
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # ESLint (next/core-web-vitals + typescript)
npm test            # Vitest: unit + database tests
npm run check       # typecheck + lint + test
```

- `tests/unit`: phone normalisation, money formatting and minor-unit maths, slugs (incl. a check that the reserved list matches the SQL), cart sanitising/pricing, WhatsApp message formatting/escaping/URL encoding, app URL resolution (never localhost on Vercel), image-URL ownership checks, rate limiting, Zod schemas (price precision, order payloads, client prices ignored).
- `tests/unit/security-invariants.test.ts`: static guards that fail if an owner Server Action stops verifying the session before touching data, if an update/delete isn't scoped to the owner's restaurant, if `restaurant_id`/`owner_id` ever come from anywhere but the session, if the public menu columns drift from the SQL `anon` grant, or if a service-role/secret key appears in the code.
- Browser end-to-end checks (Puppeteer) were run during development from a scratch folder and are not part of `npm test`.
- `tests/db/rls.test.ts`: runs **the real migration** in PGlite (Postgres compiled to WASM) with a small shim for Supabase's `auth`/`storage` schemas and `anon`/`authenticated` roles ([tests/db/supabase-shim.sql](tests/db/supabase-shim.sql)). It verifies cross-tenant reads and writes are blocked, ownership can't be transferred, `anon` is read-only and can't see unpublished menus or `owner_id`, cross-restaurant category references fail, a non-empty category can't be deleted, the limit triggers work, storage folder policies hold, and helper functions aren't callable by `anon`.

---

## Free-tier limits & production checklist

- **Supabase free plan:** 500 MB database, 1 GB file storage, 5 GB egress, 50k monthly active users. Projects **pause after ~1 week of inactivity**; a paused project means public menus stop loading, so upgrade or keep it active before relying on it. There are no automatic backups on the free plan.
- **Vercel Hobby:** for **non-commercial use** per Vercel's terms. Once you charge restaurants, move to **Pro**. Image optimisation is disabled (`images.unoptimized`) because uploads are already compressed, which avoids optimisation quotas.
- **Auth emails:** configure custom SMTP before onboarding real customers (the default sender is rate-limited).
- **Rate limiting** is in-memory per serverless instance (best effort). For strict limits add a shared store (e.g. Upstash Redis free tier) in [src/lib/rate-limit.ts](src/lib/rate-limit.ts), and consider Vercel's firewall rules.
- Before going live: set custom SMTP, set Site/Redirect URLs, set `NEXT_PUBLIC_APP_URL`, turn on Supabase leaked-password protection and MFA for your own account, add a privacy policy / terms page, and print a test QR from production.

---

## Known limitations

- No payment/subscription processing: billing is manual (by design for the MVP). The pricing page says so.
- Orders are not stored. They exist only as WhatsApp messages (no order history or analytics, which the UI doesn't claim to have).
- No account or restaurant deletion UI.
- One restaurant per owner account; no staff accounts or roles.
- No content security policy (CSP) header yet; Next.js needs nonce-based CSP, a reasonable follow-up.
- The demo dashboard doesn't share edits between pages (each page starts from the sample data).
- Unsaved uploads are cleaned up on save or cancel, but not if the owner closes the tab mid-edit; those files remain in storage.

---

## Verification status

What was actually run during development (Windows, Node 23, Chrome headless against `next start` production builds):

| Area | How it was verified | Result |
| --- | --- | --- |
| Types, lint | `npm run typecheck`, `npm run lint` | Clean |
| Business logic | 56 unit tests (cart maths, WhatsApp message/URL, phone, slugs, app URL, schemas) | Pass |
| Tenant isolation | 20 tests running the real migration in PGlite with emulated Supabase roles | Pass |
| Security invariants | 26 static tests (session check before data access, restaurant-scoped writes, column grants, no secrets), each confirmed to fail when the code is deliberately broken | Pass |
| Customer ordering | Browser: add/remove, sold-out items, cart persistence, delivery validation, server-verified subtotal, message content, wa.me link, "not confirmed" notice | Pass |
| QR codes | Downloaded PNG and SVG, the printable card and the landing-page QR were **decoded** and contain the exact production menu URL | Pass |
| Production URL safety | Built with `NEXT_PUBLIC_APP_URL=http://localhost:3000` and run with Vercel production env vars: QR still pointed at the `*.vercel.app` URL | Pass |
| Printing | Print media: sidebar/controls hidden; 1-up and 4-up layouts each fit on one A4 page | Pass |
| Safe demo | Editing, deleting and saving settings in the demo dashboard sent **zero** POST/Server Action requests; data resets on reload | Pass |
| Contact & demo env vars | With `NEXT_PUBLIC_SALES_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_DEMO_WHATSAPP_NUMBER` set: CTAs, footer, pricing and demo orders link to the right numbers; no checkout links | Pass |
| Without any env vars | Landing, pricing, demo menu and demo dashboard work; account pages show "Setup required" | Pass |
| Responsive | No horizontal overflow at 390 px on landing, pricing, demo, menu and dashboard pages | Pass |

**Not verified (needs your Supabase project and/or a Vercel deployment):**

- Sign-up, email verification, login/logout, password reset and session refresh against real Supabase Auth.
- Real image uploads to Supabase Storage (bucket limits, storage policies on the hosted service) and the unused-upload cleanup.
- Live dashboard Server Actions against a real database (create/edit/delete/reorder, slug availability, settings save). Their database rules are covered by the PGlite tests and their code by the static guards, but they haven't run end-to-end.
- An actual Vercel deployment. The build only ran locally on Windows; Vercel builds on Linux with `npm run build`.
- Scanning the printed QR with a physical phone, and opening the WhatsApp link in the real WhatsApp app (link format verified, app behaviour not).
- PGlite emulates Supabase's `auth`/`storage` schemas; the hosted service may differ in detail, so re-test cross-account isolation as described in [Testing the deployment](#testing-the-deployment).
