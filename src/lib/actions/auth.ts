"use server";

import { redirect } from "next/navigation";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getAppUrl } from "@/lib/app-url.server";
import { isSupabaseConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request.server";
import { createClient } from "@/lib/supabase/server";
import {
  emailSchema,
  fieldErrorsOf,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation";

const NOT_CONFIGURED =
  "Sign-in is not available yet: Supabase environment variables are missing.";

async function limited(key: string, limit: number, windowMs: number) {
  const ip = await getClientIp();
  return !rateLimit(`${key}:${ip}`, limit, windowMs).allowed;
}

/** Only allow same-site relative redirects after login. */
function safeNext(next: unknown): string {
  if (typeof next !== "string") return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/dashboard";
  }
  return next;
}

export async function signUpAction(
  input: unknown,
): Promise<ActionResult<{ needsVerification: boolean; email: string }>> {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);
  if (await limited("signup", 5, 60 * 60 * 1000)) {
    return fail("Too many sign-up attempts. Please try again later.");
  }

  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
  }

  const { email, password, fullName } = parsed.data;
  const supabase = await createClient();
  const appUrl = await getAppUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${appUrl}/auth/confirm?next=/onboarding`,
    },
  });

  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      return fail("An account with this email already exists. Try logging in.");
    }
    if (/password/i.test(error.message)) {
      return fail(error.message, { password: error.message });
    }
    return fail("We couldn't create your account. Please try again.");
  }

  // With email confirmation enabled Supabase returns no session. When the
  // address is already registered it returns a user with no identities.
  if (data.user && data.user.identities?.length === 0) {
    return fail("An account with this email already exists. Try logging in.");
  }

  return ok({ needsVerification: !data.session, email });
}

export async function signInAction(
  input: unknown,
  next?: string,
): Promise<ActionResult<{ unverified?: boolean }>> {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);
  if (await limited("login", 10, 10 * 60 * 1000)) {
    return fail("Too many login attempts. Please wait a few minutes.");
  }

  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (/email not confirmed/i.test(error.message)) {
      return {
        ok: false,
        error:
          "Please confirm your email address first. Check your inbox for the verification link.",
        fieldErrors: { unverified: "true" },
      };
    }
    return fail("Incorrect email or password.");
  }

  redirect(safeNext(next));
}

export async function resendVerificationAction(
  input: unknown,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);
  if (await limited("resend", 3, 15 * 60 * 1000)) {
    return fail("Please wait a few minutes before requesting another email.");
  }
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return fail("Enter a valid email address.");

  const supabase = await createClient();
  const appUrl = await getAppUrl();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: `${appUrl}/auth/confirm?next=/onboarding` },
  });
  if (error) return fail("We couldn't resend the email. Please try again later.");
  return ok(undefined, "Verification email sent.");
}

/**
 * Sends a password reset email. Always reports success (when the input is
 * valid) so the form can't be used to discover which emails have accounts.
 */
export async function requestPasswordResetAction(
  input: unknown,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);
  if (await limited("reset", 3, 15 * 60 * 1000)) {
    return fail("Please wait a few minutes before requesting another email.");
  }
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
  }

  const supabase = await createClient();
  const appUrl = await getAppUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/confirm?next=/reset-password`,
  });
  // Supabase rate-limit errors are the only ones worth surfacing.
  if (error && /rate limit/i.test(error.message)) {
    return fail("Too many emails requested. Please try again later.");
  }
  if (error) console.error("resetPasswordForEmail", error.message);
  return ok(undefined, "If an account exists for this email, a reset link is on its way.");
}

/** Sets a new password for the user signed in via the recovery link. */
export async function updatePasswordAction(input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", fieldErrorsOf(parsed.error));
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return fail("Your reset link has expired. Please request a new one.");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (/different from the old/i.test(error.message)) {
      return fail("Choose a password you haven't used before.", {
        password: "Choose a new password",
      });
    }
    if (/password/i.test(error.message)) {
      return fail(error.message, { password: error.message });
    }
    return fail("We couldn't update your password. Please try again.");
  }
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
