"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Field, fieldAria } from "@/components/form/field";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await requestPasswordResetAction(values);
      if (!result.ok) {
        setFormError(result.error);
        if (result.fieldErrors?.email) form.setError("email", { message: result.fieldErrors.email });
        return;
      }
      setSentTo(values.email);
    });
  });

  if (sentTo) {
    return (
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-secondary">
            <MailCheck className="size-6 text-primary" aria-hidden />
          </div>
          <CardTitle className="font-display text-2xl">Check your email</CardTitle>
          <CardDescription>
            If an account exists for <strong className="text-foreground">{sentTo}</strong>, we&apos;ve sent
            a link to reset your password. Open it on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Can&apos;t find it? Check your spam folder, or wait a few minutes and try again.
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to log in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Forgot your password?</CardTitle>
        <CardDescription>Enter your account email and we&apos;ll send you a reset link.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {formError && (
          <Alert variant="destructive" aria-live="polite">
            <AlertTitle>{formError}</AlertTitle>
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
          <Button type="submit" size="lg" className="h-10" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Send reset link
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Remembered it?&nbsp;
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </CardFooter>
    </Card>
  );
}
