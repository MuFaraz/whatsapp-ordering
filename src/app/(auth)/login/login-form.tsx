"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailWarning } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field, fieldAria } from "@/components/form/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resendVerificationAction, signInAction } from "@/lib/actions/auth";
import { signInSchema, type SignInInput } from "@/lib/validation";

export function LoginForm({
  next,
  verificationFailed,
}: {
  next?: string;
  verificationFailed?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    setUnverifiedEmail(null);
    startTransition(async () => {
      // On success the action redirects, so we only handle failures here.
      const result = await signInAction(values, next);
      if (result && !result.ok) {
        setFormError(result.error);
        if (result.fieldErrors?.unverified) setUnverifiedEmail(values.email);
      }
    });
  });

  const resend = () => {
    if (!unverifiedEmail) return;
    startTransition(async () => {
      const result = await resendVerificationAction(unverifiedEmail);
      if (result.ok) toast.success("Verification email sent. Check your inbox.");
      else toast.error(result.error);
    });
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
        <CardDescription>Log in to manage your restaurant menu.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {verificationFailed && (
          <Alert variant="destructive">
            <MailWarning />
            <AlertTitle>Verification link expired or invalid</AlertTitle>
            <AlertDescription>
              Log in below to request a new verification email.
            </AlertDescription>
          </Alert>
        )}
        {formError && (
          <Alert variant="destructive" aria-live="polite">
            <AlertTitle>{formError}</AlertTitle>
            {unverifiedEmail && (
              <AlertDescription>
                <Button type="button" variant="link" className="h-auto p-0" onClick={resend} disabled={pending}>
                  Resend verification email
                </Button>
              </AlertDescription>
            )}
          </Alert>
        )}
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field id="email" label="Email" error={errors.email?.message}>
            <Input
              {...fieldAria("email", errors.email?.message)}
              type="email"
              autoComplete="email"
              inputMode="email"
              className="h-10"
              {...form.register("email")}
            />
          </Field>
          <Field
            id="password"
            label={
              <span className="flex w-full items-center justify-between">
                Password
                <Link href="/forgot-password" className="text-sm font-normal text-primary hover:underline">
                  Forgot password?
                </Link>
              </span>
            }
            error={errors.password?.message}
          >
            <Input
              {...fieldAria("password", errors.password?.message)}
              type="password"
              autoComplete="current-password"
              className="h-10"
              {...form.register("password")}
            />
          </Field>
          <Button type="submit" size="lg" className="h-10" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Log in
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        New here?&nbsp;
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </CardFooter>
    </Card>
  );
}
