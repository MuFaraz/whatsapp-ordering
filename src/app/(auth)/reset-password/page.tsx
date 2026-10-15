import type { Metadata } from "next";
import Link from "next/link";
import { SetupRequired } from "@/components/setup-required";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

/** Reached from the recovery email via /auth/confirm, which signs the user in. */
export default async function ResetPasswordPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Reset link expired</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired. Request a new one to continue.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return <ResetPasswordForm email={user.email} />;
}
