"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch, type Path } from "react-hook-form";
import { toast } from "sonner";
import { Field, fieldAria } from "@/components/form/field";
import { ImageUploadField } from "@/components/form/image-upload-field";
import { useUploadTracker } from "@/components/form/use-upload-tracker";
import { SlugStatusHint } from "@/components/form/slug-status";
import { useSlugAvailability } from "@/components/form/use-slug-availability";
import { WhatsappHint } from "@/components/form/whatsapp-hint";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORTED_CURRENCIES } from "@/config/site";
import { checkSlugAvailabilityAction } from "@/lib/actions/restaurant";
import { CURRENCY_LABELS } from "@/lib/money";
import { restaurantSettingsSchema, type RestaurantSettingsInput } from "@/lib/validation";
import type { Restaurant } from "@/types/database";
import { PageHeader } from "./dashboard-shell";
import { useDashboardOps } from "./ops-context";

function toFormValues(r: Restaurant): RestaurantSettingsInput {
  return {
    name: r.name,
    slug: r.slug,
    description: r.description ?? "",
    whatsappNumber: r.whatsapp_number,
    contactPhone: r.contact_phone ?? "",
    contactEmail: r.contact_email ?? "",
    address: r.address ?? "",
    currency: r.currency,
    isPublished: r.is_published,
    acceptsDineIn: r.accepts_dine_in,
    acceptsTakeaway: r.accepts_takeaway,
    acceptsDelivery: r.accepts_delivery,
    tableNumberEnabled: r.table_number_enabled,
    logoUrl: r.logo_url,
    coverUrl: r.cover_url,
  };
}

async function checkSlug(slug: string) {
  const result = await checkSlugAvailabilityAction(slug);
  return result.ok
    ? { ok: true, available: result.data.available }
    : { ok: false, error: result.error };
}

function ToggleRow({
  id,
  title,
  description,
  checked,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-3">
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const ops = useDashboardOps();
  const [saved, setSaved] = useState(() => toFormValues(restaurant));
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const uploads = useUploadTracker(ops.discardImages);

  const form = useForm<RestaurantSettingsInput>({
    resolver: zodResolver(restaurantSettingsSchema),
    defaultValues: saved,
  });
  const { errors, isDirty } = form.formState;
  const [slug, whatsapp] = useWatch({ control: form.control, name: ["slug", "whatsappNumber"] });

  const slugChanged = slug !== saved.slug;
  const slugStatus = useSlugAvailability(slug, ops.mode === "live" && slugChanged ? checkSlug : null);

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await ops.updateSettings(values);
      if (!result.ok) {
        setFormError(result.error);
        for (const [key, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(key as Path<RestaurantSettingsInput>, { message });
        }
        return;
      }
      uploads.commit([values.logoUrl, values.coverUrl]);
      toast.success(result.message ?? "Settings saved");
      setSaved(values);
      form.reset(values);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader
        title="Settings"
        description="Your restaurant profile and how customers can order."
        actions={
          <Button type="submit" disabled={pending || !isDirty}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            Save changes
          </Button>
        }
      />

      {formError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>{formError}</AlertTitle>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Restaurant profile</CardTitle>
            <CardDescription>Shown at the top of your public menu.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field id="name" label="Restaurant name" error={errors.name?.message}>
              <Input {...fieldAria("name", errors.name?.message)} className="h-10" {...form.register("name")} />
            </Field>
            <Field id="description" label="Description" optional error={errors.description?.message}>
              <Textarea
                {...fieldAria("description", errors.description?.message)}
                rows={3}
                maxLength={500}
                {...form.register("description")}
              />
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <ImageUploadField
                    label="Logo"
                    value={field.value}
                    onChange={field.onChange}
                    upload={(file) => ops.uploadImage(file, "logo").then(uploads.track)}
                    aspect="aspect-square"
                    hint="Square images work best."
                  />
                )}
              />
              <Controller
                control={form.control}
                name="coverUrl"
                render={({ field }) => (
                  <ImageUploadField
                    label="Cover image"
                    value={field.value}
                    onChange={field.onChange}
                    upload={(file) => ops.uploadImage(file, "cover").then(uploads.track)}
                    aspect="aspect-[3/1]"
                    hint="A wide photo of your food or space."
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Menu link</CardTitle>
            <CardDescription>The address your QR code points to.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field id="slug" label="Link" error={errors.slug?.message}>
              <div className="flex items-center overflow-hidden rounded-lg border border-input bg-background focus-within:ring-3 focus-within:ring-ring/50">
                <span className="border-r bg-muted px-3 py-2 text-sm text-muted-foreground">/menu/</span>
                <input
                  {...fieldAria("slug", errors.slug?.message)}
                  className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                  autoCapitalize="none"
                  spellCheck={false}
                  {...form.register("slug")}
                />
              </div>
              <SlugStatusHint status={slugStatus} />
            </Field>
            {slugChanged && (
              <Alert>
                <TriangleAlert />
                <AlertTitle>Changing your link breaks printed QR codes</AlertTitle>
                <AlertDescription>
                  Your old link stops working. Download and print a new QR code after saving.
                </AlertDescription>
              </Alert>
            )}
            <Controller
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <ToggleRow
                  id="isPublished"
                  title="Menu is public"
                  description="Turn off to hide your menu from customers temporarily."
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ordering</CardTitle>
            <CardDescription>
              Customers send orders to your WhatsApp. Choose which order types you accept.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
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
                className="h-10"
                {...form.register("whatsappNumber")}
              />
              <WhatsappHint value={whatsapp} />
            </Field>
            <Field id="currency" label="Currency" error={errors.currency?.message}>
              <Controller
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="currency" className="h-10! w-full sm:w-72">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}: {CURRENCY_LABELS[code]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["acceptsDineIn", "Dine-in", "Customers ordering at a table."],
                  ["acceptsTakeaway", "Takeaway", "Customers collect their order."],
                  ["acceptsDelivery", "Delivery", "Customers add a delivery address."],
                  ["tableNumberEnabled", "Ask for table number", "Shown for dine-in orders."],
                ] as const
              ).map(([name, title, description]) => (
                <Controller
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <ToggleRow
                      id={name}
                      title={title}
                      description={description}
                      checked={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        if (name !== "tableNumberEnabled") void form.trigger("acceptsDineIn");
                      }}
                    />
                  )}
                />
              ))}
            </div>
            {errors.acceptsDineIn?.message && (
              <p role="alert" className="text-sm text-destructive">
                {errors.acceptsDineIn.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
            <CardDescription>Optional. Shown at the bottom of your menu.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field id="contactPhone" label="Phone" optional error={errors.contactPhone?.message}>
              <Input {...fieldAria("contactPhone", errors.contactPhone?.message)} type="tel" className="h-10" {...form.register("contactPhone")} />
            </Field>
            <Field id="contactEmail" label="Email" optional error={errors.contactEmail?.message}>
              <Input {...fieldAria("contactEmail", errors.contactEmail?.message)} type="email" className="h-10" {...form.register("contactEmail")} />
            </Field>
            <Field id="address" label="Address" optional error={errors.address?.message} className="sm:col-span-2">
              <Input {...fieldAria("address", errors.address?.message)} className="h-10" {...form.register("address")} />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={pending || !isDirty}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            Save changes
          </Button>
        </div>
      </div>
    </form>
  );
}
