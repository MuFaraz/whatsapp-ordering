"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Field, fieldAria } from "@/components/form/field";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updatePasswordAction } from "@/lib/actions/auth";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation";

export function ResetPasswordForm({ email }: { email: string | null }) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      // On success the action redirects to the dashboard.
      const result = await updatePasswordAction(values);
      if (result && !result.ok) {
        setFormError(result.error);
        if (result.fieldErrors?.password) {
          form.setError("password", { message: result.fieldErrors.password });
        }
      }
    });
  });

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Choose a new password</CardTitle>
        <CardDescription>
          {email ? <>For {email}. </> : null}You&apos;ll stay signed in after saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {formError && (
          <Alert variant="destructive" aria-live="polite">
            <AlertTitle>{formError}</AlertTitle>
          </Alert>
        )}
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field id="password" label="New password" hint="At least 8 characters." error={errors.password?.message}>
            <Input
              {...fieldAria("password", errors.password?.message, true)}
              type="password"
              autoComplete="new-password"
              className="h-10"
              {...form.register("password")}
            />
          </Field>
          <Field id="confirmPassword" label="Confirm new password" error={errors.confirmPassword?.message}>
            <Input
              {...fieldAria("confirmPassword", errors.confirmPassword?.message)}
              type="password"
              autoComplete="new-password"
              className="h-10"
              {...form.register("confirmPassword")}
            />
          </Field>
          <Button type="submit" size="lg" className="h-10" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Save new password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
