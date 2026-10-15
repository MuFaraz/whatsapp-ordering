-- =============================================================================
-- Bun & Brew Menu — initial schema
-- Multi-tenant QR menu SaaS: profiles, restaurants, menu_categories, menu_items
-- plus the `menu-images` storage bucket. Every table has Row Level Security.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles: one row per auth user (restaurant owner)
-- -----------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (full_name is null or char_length(full_name) <= 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 100), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- restaurants
-- -----------------------------------------------------------------------------

create table public.restaurants (
  id                     uuid primary key default gen_random_uuid(),
  -- NULL only for the built-in demo restaurant, which therefore can never be
  -- modified through the API (all write policies require owner_id = auth.uid()).
  owner_id               uuid references public.profiles (id) on delete cascade,
  name                   text not null check (char_length(trim(name)) between 2 and 80),
  slug                   text not null,
  description            text check (description is null or char_length(description) <= 500),
  logo_url               text check (logo_url is null or char_length(logo_url) <= 1000),
  cover_url              text check (cover_url is null or char_length(cover_url) <= 1000),
  whatsapp_number        text not null check (whatsapp_number ~ '^\+[1-9][0-9]{7,14}$'),
  contact_phone          text check (contact_phone is null or char_length(contact_phone) <= 30),
  contact_email          text check (contact_email is null or char_length(contact_email) <= 254),
  address                text check (address is null or char_length(address) <= 200),
  currency               text not null default 'PKR' check (currency in ('PKR', 'USD')),
  is_published           boolean not null default true,
  is_demo                boolean not null default false,
  accepts_dine_in        boolean not null default true,
  accepts_takeaway       boolean not null default true,
  accepts_delivery       boolean not null default false,
  table_number_enabled   boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint restaurants_slug_format check (
    slug ~ '^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$' and slug !~ '--'
  ),
  constraint restaurants_slug_not_reserved check (
    slug not in (
      'admin', 'api', 'app', 'auth', 'dashboard', 'demo', 'login', 'logout',
      'menu', 'onboarding', 'pricing', 'settings', 'signup', 'support',
      'help', 'www', 'static', 'assets', 'bun-and-brew-demo'
    )
  ),
  constraint restaurants_owner_required check (owner_id is not null or is_demo),
  constraint restaurants_order_type_required check (
    accepts_dine_in or accepts_takeaway or accepts_delivery
  )
);

create unique index restaurants_slug_key on public.restaurants (slug);
-- MVP: one restaurant per owner.
create unique index restaurants_owner_id_key on public.restaurants (owner_id) where owner_id is not null;

create trigger restaurants_set_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();

-- Ownership helper used by policies. SECURITY DEFINER so it can read
-- restaurants without recursively evaluating RLS; it only answers yes/no for
-- the *calling* user.
create or replace function public.owns_restaurant(p_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = p_restaurant_id
      and r.owner_id = (select auth.uid())
  );
$$;

create or replace function public.restaurant_is_public(p_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = p_restaurant_id and r.is_published
  );
$$;

-- Lets a signed-in owner check whether a slug is free without being able to
-- read other restaurants' rows.
create or replace function public.is_slug_available(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.restaurants r where r.slug = lower(trim(p_slug))
  );
$$;

-- -----------------------------------------------------------------------------
-- menu_categories
-- -----------------------------------------------------------------------------

create table public.menu_categories (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  name           text not null check (char_length(trim(name)) between 1 and 60),
  description    text check (description is null or char_length(description) <= 200),
  sort_order     integer not null default 0 check (sort_order >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Allows menu_items to reference (category, restaurant) together so an item
  -- can never point at another restaurant's category.
  constraint menu_categories_id_restaurant_key unique (id, restaurant_id)
);

create unique index menu_categories_restaurant_name_key
  on public.menu_categories (restaurant_id, lower(name));
create index menu_categories_restaurant_sort_idx
  on public.menu_categories (restaurant_id, sort_order);

create trigger menu_categories_set_updated_at
  before update on public.menu_categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- menu_items
-- -----------------------------------------------------------------------------

create table public.menu_items (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  category_id    uuid not null,
  name           text not null check (char_length(trim(name)) between 1 and 80),
  description    text check (description is null or char_length(description) <= 300),
  price          numeric(12, 2) not null check (price >= 0 and price <= 1000000),
  image_url      text check (image_url is null or char_length(image_url) <= 1000),
  is_available   boolean not null default true,
  sort_order     integer not null default 0 check (sort_order >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- ON DELETE RESTRICT: a category with items cannot be deleted until its
  -- items are moved or removed.
  constraint menu_items_category_fkey foreign key (category_id, restaurant_id)
    references public.menu_categories (id, restaurant_id) on delete restrict
);

create index menu_items_restaurant_idx on public.menu_items (restaurant_id);
create index menu_items_category_sort_idx on public.menu_items (category_id, sort_order);
create index menu_items_restaurant_updated_idx on public.menu_items (restaurant_id, updated_at desc);

create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Abuse protection: cap rows per restaurant (free-tier friendly)
-- -----------------------------------------------------------------------------

create or replace function public.enforce_menu_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  if tg_table_name = 'menu_categories' then
    select count(*) into current_count
      from public.menu_categories where restaurant_id = new.restaurant_id;
    if current_count >= 50 then
      raise exception 'Category limit reached (50 per restaurant)'
        using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'menu_items' then
    select count(*) into current_count
      from public.menu_items where restaurant_id = new.restaurant_id;
    if current_count >= 500 then
      raise exception 'Menu item limit reached (500 per restaurant)'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger menu_categories_limit
  before insert on public.menu_categories
  for each row execute function public.enforce_menu_limits();

create trigger menu_items_limit
  before insert on public.menu_items
  for each row execute function public.enforce_menu_limits();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.restaurants     enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;

-- Defence in depth: anonymous visitors can only ever read.
revoke insert, update, delete, truncate on
  public.profiles, public.restaurants, public.menu_categories, public.menu_items
  from anon;
revoke all on public.profiles from anon;
revoke truncate on
  public.profiles, public.restaurants, public.menu_categories, public.menu_items
  from authenticated;

-- profiles -------------------------------------------------------------------
create policy "Owners can read their profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Owners can update their profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- restaurants ------------------------------------------------------------------
-- Public menu: anonymous visitors may read published restaurants only. The app
-- always reads public menus with a cookie-less (anon) client.
create policy "Public can read published restaurants"
  on public.restaurants for select to anon
  using (is_published);

create policy "Owners can read their restaurant"
  on public.restaurants for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owners can create their restaurant"
  on public.restaurants for insert to authenticated
  with check (owner_id = (select auth.uid()) and not is_demo);

create policy "Owners can update their restaurant"
  on public.restaurants for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and not is_demo);

create policy "Owners can delete their restaurant"
  on public.restaurants for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Hide owner_id from anonymous readers (column-level privilege).
revoke select on public.restaurants from anon;
grant select (
  id, name, slug, description, logo_url, cover_url, whatsapp_number,
  contact_phone, contact_email, address, currency, is_published, is_demo,
  accepts_dine_in, accepts_takeaway, accepts_delivery, table_number_enabled,
  created_at, updated_at
) on public.restaurants to anon;

-- menu_categories ------------------------------------------------------------
create policy "Public can read categories of published restaurants"
  on public.menu_categories for select to anon
  using (public.restaurant_is_public(restaurant_id));

create policy "Owners can read their categories"
  on public.menu_categories for select to authenticated
  using (public.owns_restaurant(restaurant_id));

create policy "Owners can create categories"
  on public.menu_categories for insert to authenticated
  with check (public.owns_restaurant(restaurant_id));

create policy "Owners can update categories"
  on public.menu_categories for update to authenticated
  using (public.owns_restaurant(restaurant_id))
  with check (public.owns_restaurant(restaurant_id));

create policy "Owners can delete categories"
  on public.menu_categories for delete to authenticated
  using (public.owns_restaurant(restaurant_id));

-- menu_items -----------------------------------------------------------------
create policy "Public can read items of published restaurants"
  on public.menu_items for select to anon
  using (public.restaurant_is_public(restaurant_id));

create policy "Owners can read their items"
  on public.menu_items for select to authenticated
  using (public.owns_restaurant(restaurant_id));

create policy "Owners can create items"
  on public.menu_items for insert to authenticated
  with check (public.owns_restaurant(restaurant_id));

create policy "Owners can update items"
  on public.menu_items for update to authenticated
  using (public.owns_restaurant(restaurant_id))
  with check (public.owns_restaurant(restaurant_id));

create policy "Owners can delete items"
  on public.menu_items for delete to authenticated
  using (public.owns_restaurant(restaurant_id));

-- Function privileges ----------------------------------------------------------
-- Supabase grants EXECUTE on new functions to anon/authenticated by default,
-- so revoking from PUBLIC alone is not enough: revoke from the API roles too.
revoke execute on function public.owns_restaurant(uuid) from public, anon, authenticated;
revoke execute on function public.restaurant_is_public(uuid) from public, anon, authenticated;
revoke execute on function public.is_slug_available(text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_menu_limits() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.owns_restaurant(uuid) to authenticated;
grant execute on function public.restaurant_is_public(uuid) to anon, authenticated;
grant execute on function public.is_slug_available(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: menu images
-- Public-read bucket (images are shown on public menus). Size and MIME limits
-- are enforced by Supabase Storage on the server. Objects must live under a
-- folder named after a restaurant the uploader owns: `<restaurant_id>/<file>`.
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.owns_storage_folder(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.restaurants r
    where r.id::text = split_part(p_object_name, '/', 1)
      and r.owner_id = (select auth.uid())
  );
$$;

revoke execute on function public.owns_storage_folder(text) from public, anon, authenticated;
grant execute on function public.owns_storage_folder(text) to authenticated;

create policy "Owners can read their menu images"
  on storage.objects for select to authenticated
  using (bucket_id = 'menu-images' and public.owns_storage_folder(name));

create policy "Owners can upload menu images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images' and public.owns_storage_folder(name));

create policy "Owners can update their menu images"
  on storage.objects for update to authenticated
  using (bucket_id = 'menu-images' and public.owns_storage_folder(name))
  with check (bucket_id = 'menu-images' and public.owns_storage_folder(name));

create policy "Owners can delete their menu images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images' and public.owns_storage_folder(name));
