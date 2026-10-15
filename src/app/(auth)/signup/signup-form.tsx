"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field, fieldAria } from "@/components/form/field";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resendVerificationAction, signUpAction } from "@/lib/actions/auth";
import { signUpSchema, type SignUpInput } from "@/lib/validation";

export function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await signUpAction(values);
      if (!result.ok) {
        setFormError(result.error);
        for (const [key, message] of Object.entries(result.fieldErrors ?? {})) {
          if (key in values) form.setError(key as keyof SignUpInput, { message });
        }
        return;
      }
      if (result.data.needsVerification) {
        setVerifyEmail(result.data.email);
      } else {
        toast.success("Account created");
        router.push("/onboarding");
        router.refresh();
      }
    });
  });

  if (verifyEmail) {
    return (
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-secondary">
            <MailCheck className="size-6 text-primary" aria-hidden />
          </div>
          <CardTitle className="font-display text-2xl">Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to <strong className="text-foreground">{verifyEmail}</strong>.
            Open it on this device to activate your account and set up your restaurant.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>Can&apos;t find it? Check your spam or promotions folder.</p>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await resendVerificationAction(verifyEmail);
                if (result.ok) toast.success("Verification email sent again.");
                else toast.error(result.error);
              })
            }
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Resend email
          </Button>
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
        <CardTitle className="font-display text-2xl">Create your account</CardTitle>
        <CardDescription>
          Set up your restaurant&apos;s QR menu in about 10 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {formError && (
          <Alert variant="destructive" aria-live="polite">
            <AlertTitle>{formError}</AlertTitle>
          </Alert>
        )}
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field id="fullName" label="Your name" error={errors.fullName?.message}>
            <Input
              {...fieldAria("fullName", errors.fullName?.message)}
              autoComplete="name"
              className="h-10"
              {...form.register("fullName")}
            />
          </Field>
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
            label="Password"
            hint="At least 8 characters."
            error={errors.password?.message}
          >
            <Input
              {...fieldAria("password", errors.password?.message, true)}
              type="password"
              autoComplete="new-password"
              className="h-10"
              {...form.register("password")}
            />
          </Field>
          <Button type="submit" size="lg" className="h-10" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Create account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?&nbsp;
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </CardFooter>
    </Card>
  );
}
