"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { cn } from "cn";
import { Field, fieldAria } from "@/components/form/field";
import { ImageUploadField } from "@/components/form/image-upload-field";
import { useUploadTracker } from "@/components/form/use-upload-tracker";
import { SlugStatusHint } from "@/components/form/slug-status";
import { useSlugAvailability } from "@/components/form/use-slug-availability";
import { WhatsappHint } from "@/components/form/whatsapp-hint";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORTED_CURRENCIES } from "@/config/site";
import {
  checkSlugAvailabilityAction,
  createRestaurantAction,
  updateBrandingAction,
} from "@/lib/actions/restaurant";
import { discardUploadedImagesAction } from "@/lib/actions/uploads";
import { uploadMenuImage } from "@/lib/image-upload";
import { CURRENCY_LABELS } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { restaurantCreateSchema, type RestaurantCreateInput } from "@/lib/validation";

const STEPS = [
  { title: "Restaurant name", fields: ["name", "slug"] },
  { title: "WhatsApp number", fields: ["whatsappNumber"] },
  { title: "Currency", fields: ["currency"] },
] as const;

function StepIndicator({ current }: { current: number }) {
  const labels = ["Name & link", "WhatsApp", "Currency", "Branding"];
  return (
    <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Setup progress">
      {labels.map((label, i) => (
        <li key={label} className="grid gap-1.5" aria-current={i === current ? "step" : undefined}>
          <span
            className={cn(
              "h-1.5 rounded-full",
              i <= current ? "bg-primary" : "bg-border",
            )}
          />
          <span className={cn("text-xs", i === current ? "font-semibold" : "text-muted-foreground")}>
            {i + 1}. {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

async function checkSlug(slug: string) {
  const result = await checkSlugAvailabilityAction(slug);
  return result.ok
    ? { ok: true, available: result.data.available }
    : { ok: false, error: result.error };
}

export function CreateRestaurantWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [slugEdited, setSlugEdited] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<RestaurantCreateInput>({
    resolver: zodResolver(restaurantCreateSchema),
    defaultValues: { name: "", slug: "", whatsappNumber: "+92", currency: "PKR" },
    mode: "onTouched",
  });
  const { errors } = form.formState;
  const [slug, whatsapp, currency] = useWatch({
    control: form.control,
    name: ["slug", "whatsappNumber", "currency"],
  });
  const slugStatus = useSlugAvailability(slug, checkSlug);

  const next = async () => {
    const valid = await form.trigger([...STEPS[step]!.fields]);
    if (!valid) return;
    if (step === 0 && slugStatus.state === "taken") {
      form.setError("slug", { message: "This link is already taken. Try another one." });
      return;
    }
    setStep((s) => s + 1);
  };

  const submit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await createRestaurantAction(values);
      if (!result.ok) {
        setFormError(result.error);
        const fieldErrors = result.fieldErrors ?? {};
        for (const [key, message] of Object.entries(fieldErrors)) {
          if (key in values) form.setError(key as keyof RestaurantCreateInput, { message });
        }
        if (fieldErrors.name || fieldErrors.slug) setStep(0);
        else if (fieldErrors.whatsappNumber) setStep(1);
        return;
      }
      toast.success("Restaurant created!");
      router.push("/onboarding?step=branding");
      router.refresh();
    });
  });

  const isLast = step === STEPS.length - 1;

  return (
    <>
      <StepIndicator current={step} />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            {step === 0 && "What's your restaurant called?"}
            {step === 1 && "Where should orders go?"}
            {step === 2 && "Which currency do you use?"}
          </CardTitle>
          <CardDescription>
            {step === 0 && "This appears at the top of your menu. You can change it later."}
            {step === 1 && "Customers' orders open as a WhatsApp chat with this number."}
            {step === 2 && "Prices on your menu are shown in this currency."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (isLast) void submit(e);
              else void next();
            }}
            className="grid gap-5"
          >
            {formError && (
              <Alert variant="destructive">
                <AlertTitle>{formError}</AlertTitle>
              </Alert>
            )}

            {step === 0 && (
              <>
                <Field id="name" label="Restaurant name" error={errors.name?.message}>
                  <Input
                    {...fieldAria("name", errors.name?.message)}
                    className="h-10"
                    autoFocus
                    placeholder="e.g. Karachi Grill House"
                    {...form.register("name", {
                      onChange: (e) => {
                        if (!slugEdited) {
                          form.setValue("slug", slugify(e.target.value), { shouldValidate: false });
                        }
                      },
                    })}
                  />
                </Field>
                <Field
                  id="slug"
                  label="Menu link"
                  error={errors.slug?.message}
                  hint="Lowercase letters, numbers and hyphens."
                >
                  <div className="flex items-center overflow-hidden rounded-lg border border-input focus-within:ring-3 focus-within:ring-ring/50">
                    <span className="border-r bg-muted px-3 py-2 text-sm text-muted-foreground">
                      /menu/
                    </span>
                    <input
                      {...fieldAria("slug", errors.slug?.message, true)}
                      className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                      autoCapitalize="none"
                      spellCheck={false}
                      {...form.register("slug", {
                        onChange: () => setSlugEdited(true),
                      })}
                    />
                  </div>
                  <SlugStatusHint status={slugStatus} />
                </Field>
              </>
            )}

            {step === 1 && (
              <Field
                id="whatsappNumber"
                label="WhatsApp number"
                error={errors.whatsappNumber?.message}
                hint="Include the country code, e.g. +92 300 1234567."
              >
                <Input
                  {...fieldAria("whatsappNumber", errors.whatsappNumber?.message, true)}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="h-10"
                  autoFocus
                  {...form.register("whatsappNumber")}
                />
                <WhatsappHint value={whatsapp} />
              </Field>
            )}

            {step === 2 && (
              <fieldset className="grid gap-3">
                <legend className="sr-only">Currency</legend>
                <RadioGroup
                  value={currency}
                  onValueChange={(v) => form.setValue("currency", v as RestaurantCreateInput["currency"])}
                  className="grid gap-3"
                >
                  {SUPPORTED_CURRENCIES.map((code) => (
                    <label
                      key={code}
                      htmlFor={`currency-${code}`}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary/50"
                    >
                      <RadioGroupItem id={`currency-${code}`} value={code} />
                      <span className="font-medium">{code}</span>
                      <span className="text-sm text-muted-foreground">{CURRENCY_LABELS[code]}</span>
                    </label>
                  ))}
                </RadioGroup>
              </fieldset>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || pending}
              >
                <ArrowLeft aria-hidden />
                Back
              </Button>
              <Button type="submit" size="lg" disabled={pending}>
                {pending && <Loader2 className="animate-spin" aria-hidden />}
                {isLast ? "Create restaurant" : "Continue"}
                {!isLast && <ArrowRight aria-hidden />}
                {isLast && !pending && <Check aria-hidden />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

function discardUnsaved(urls: string[]) {
  if (urls.length > 0) void discardUploadedImagesAction(urls).catch(() => undefined);
}

export function BrandingStep({
  restaurantId,
  restaurantName,
  initialDescription,
  initialLogo,
}: {
  restaurantId: string;
  restaurantName: string;
  initialDescription: string;
  initialLogo: string | null;
}) {
  const router = useRouter();
  const [description, setDescription] = useState(initialDescription);
  const [logo, setLogo] = useState<string | null>(initialLogo);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const uploads = useUploadTracker(discardUnsaved);

  const finish = (save: boolean) => {
    setError(null);
    startTransition(async () => {
      if (save) {
        const result = await updateBrandingAction({ description, logoUrl: logo });
        if (!result.ok) {
          setError(result.fieldErrors?.description ?? result.error);
          return;
        }
        uploads.commit([logo]);
      } else {
        uploads.abandon();
      }
      toast.success("You're all set! Now add your menu.");
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <>
      <StepIndicator current={3} />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Add a little personality</CardTitle>
          <CardDescription>
            A logo and short description make {restaurantName}&apos;s menu feel like yours. Both are
            optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <ImageUploadField
            label="Logo"
            value={logo}
            onChange={setLogo}
            upload={(file) => uploadMenuImage(file, "logo", restaurantId).then(uploads.track)}
            aspect="aspect-square"
          />
          <Field
            id="description"
            label="Short description"
            optional
            error={error ?? undefined}
            hint={`${description.length}/500`}
          >
            <Textarea
              {...fieldAria("description", error ?? undefined, true)}
              rows={3}
              maxLength={500}
              placeholder="e.g. Charcoal grills and fresh naan since 2015."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => finish(false)} disabled={pending}>
              Skip for now
            </Button>
            <Button size="lg" onClick={() => finish(true)} disabled={pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Save and go to dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
