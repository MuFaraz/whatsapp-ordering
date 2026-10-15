import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/types/database";

/*
 * Data Access Layer: the single place that decides who the current user is
 * and which restaurant they own. Every protected page and Server Action goes
 * through these helpers; the proxy redirect is only an optimisation.
 */

export type SessionUser = { id: string; email: string | null };

/** Verified current user (validated with Supabase Auth), or null. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** The restaurant owned by the current user (RLS limits rows to their own). */
export const getOwnedRestaurant = cache(
  async (): Promise<Restaurant | null> => {
    const user = await getCurrentUser();
    if (!user) return null;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (error) throw new Error(`Could not load restaurant: ${error.message}`);
    return data;
  },
);

/**
 * For dashboard pages and owner Server Actions: guarantees a signed-in user
 * who owns a restaurant. Restaurant ids are always taken from here, never
 * from client input.
 */
export async function requireOwner() {
  const user = await requireUser();
  const restaurant = await getOwnedRestaurant();
  if (!restaurant) redirect("/onboarding");
  const supabase = await createClient();
  return { user, restaurant, supabase };
}
