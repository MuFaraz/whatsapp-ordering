"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getOwnedRestaurant, requireOwner, requireUser } from "@/lib/auth/dal";
import { normalizePhoneNumber } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrorsOf,
  restaurantBrandingSchema,
  restaurantCreateSchema,
  restaurantSettingsSchema,
  slugSchema,
} from "@/lib/validation";
import { removeImageIfOwned, validateImageUrl } from "./images.server";

const emptyToNull = (value: string) => (value.trim() === "" ? null : value.trim());

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505";
}

function revalidateRestaurant(slug: string, previousSlug?: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/menu/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/menu/${previousSlug}`);
}

export async function checkSlugAvailabilityAction(
  slug: unknown,
): Promise<ActionResult<{ available: boolean }>> {
  const user = await requireUser();
  if (!rateLimit(`slug:${user.id}`, 60, 60 * 1000).allowed) {
    return fail("Too many checks. Please slow down.");
  }
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid link");

  const current = await getOwnedRestaurant();
  if (current?.slug === parsed.data) return ok({ available: true });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_slug_available", {
    p_slug: parsed.data,
  });
  if (error) return fail("Couldn't check this link right now.");
  return ok({ available: Boolean(data) });
}

export async function createRestaurantAction(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await requireUser();
  if (!rateLimit(`create-restaurant:${user.id}`, 10, 60 * 60 * 1000).allowed) {
    return fail("Too many attempts. Please try again later.");
  }

  const parsed = restaurantCreateSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
  }

  const existing = await getOwnedRestaurant();
  if (existing) return ok({ id: existing.id, slug: existing.slug });

  const whatsapp = normalizePhoneNumber(parsed.data.whatsappNumber);
  if (!whatsapp) {
    return fail("Invalid WhatsApp number.", {
      whatsappNumber: "Enter the full number with country code",
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      owner_id: user.id, // from the verified session, never from the client
      name: parsed.data.name,
      slug: parsed.data.slug,
      whatsapp_number: whatsapp,
      currency: parsed.data.currency,
    })
    .select("id, slug")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return fail("That link is already taken.", {
        slug: "This link is already taken. Try another one.",
      });
    }
    console.error("createRestaurant", error);
    return fail("We couldn't create your restaurant. Please try again.");
  }

  revalidatePath("/dashboard", "layout");
  return ok(data, "Restaurant created");
}

export async function updateBrandingAction(
  input: unknown,
): Promise<ActionResult> {
  const { supabase, restaurant } = await requireOwner();
  const parsed = restaurantBrandingSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
  }

  const logo = validateImageUrl(parsed.data.logoUrl, restaurant.id, restaurant.logo_url);
  if (!logo.ok) return fail("Invalid logo image.");

  const { error } = await supabase
    .from("restaurants")
    .update({ description: emptyToNull(parsed.data.description), logo_url: logo.value })
    .eq("id", restaurant.id);

  if (error) return fail("We couldn't save these details. Please try again.");

  if (restaurant.logo_url && restaurant.logo_url !== logo.value) {
    await removeImageIfOwned(supabase, restaurant.logo_url, restaurant.id);
  }
  revalidateRestaurant(restaurant.slug);
  return ok(undefined, "Saved");
}

export async function updateRestaurantSettingsAction(
  input: unknown,
): Promise<ActionResult<{ slug: string }>> {
  const { supabase, restaurant, user } = await requireOwner();
  if (!rateLimit(`settings:${user.id}`, 30, 60 * 1000).allowed) {
    return fail("Too many updates. Please wait a moment.");
  }

  const parsed = restaurantSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
  }
  const v = parsed.data;

  const whatsapp = normalizePhoneNumber(v.whatsappNumber);
  if (!whatsapp) {
    return fail("Invalid WhatsApp number.", {
      whatsappNumber: "Enter the full number with country code",
    });
  }

  const logo = validateImageUrl(v.logoUrl, restaurant.id, restaurant.logo_url);
  const cover = validateImageUrl(v.coverUrl, restaurant.id, restaurant.cover_url);
  if (!logo.ok || !cover.ok) return fail("Invalid image. Please upload it again.");

  const { error } = await supabase
    .from("restaurants")
    .update({
      name: v.name,
      slug: v.slug,
      description: emptyToNull(v.description),
      whatsapp_number: whatsapp,
      contact_phone: emptyToNull(v.contactPhone),
      contact_email: emptyToNull(v.contactEmail),
      address: emptyToNull(v.address),
      currency: v.currency,
      is_published: v.isPublished,
      accepts_dine_in: v.acceptsDineIn,
      accepts_takeaway: v.acceptsTakeaway,
      accepts_delivery: v.acceptsDelivery,
      table_number_enabled: v.tableNumberEnabled,
      logo_url: logo.value,
      cover_url: cover.value,
    })
    .eq("id", restaurant.id);

  if (error) {
    if (isUniqueViolation(error)) {
      return fail("That link is already taken.", {
        slug: "This link is already taken. Try another one.",
      });
    }
    console.error("updateRestaurantSettings", error);
    return fail("We couldn't save your settings. Please try again.");
  }

  if (restaurant.logo_url && restaurant.logo_url !== logo.value) {
    await removeImageIfOwned(supabase, restaurant.logo_url, restaurant.id);
  }
  if (restaurant.cover_url && restaurant.cover_url !== cover.value) {
    await removeImageIfOwned(supabase, restaurant.cover_url, restaurant.id);
  }

  revalidateRestaurant(v.slug, restaurant.slug);
  return ok({ slug: v.slug }, "Settings saved");
}
