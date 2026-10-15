"use client";

import { ArrowLeft, Info, Loader2, MessageCircle, ShoppingBag, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Field, fieldAria } from "@/components/form/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/config/site";
import { prepareWhatsAppOrderAction, type PreparedOrder } from "@/lib/actions/order";
import { formatPrice, fromMinorUnits } from "@/lib/money";
import type { PricedCart } from "@/lib/order/cart";
import { ORDER_TYPE_LABELS, type OrderType } from "@/lib/order/whatsapp";
import type { Currency } from "@/types/database";
import { QuantityStepper } from "./menu-item-card";

type OrderOptions = {
  dine_in: boolean;
  takeaway: boolean;
  delivery: boolean;
  tableNumber: boolean;
};

type Details = {
  orderType: OrderType;
  tableNumber: string;
  customerName: string;
  deliveryAddress: string;
  notes: string;
};

export function CartSheet({
  open,
  onOpenChange,
  slug,
  restaurantName,
  currency,
  isDemo,
  options,
  priced,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  restaurantName: string;
  currency: Currency;
  isDemo: boolean;
  options: OrderOptions;
  priced: PricedCart;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const enabledTypes = (Object.keys(ORDER_TYPE_LABELS) as OrderType[]).filter((t) => options[t]);
  const [details, setDetails] = useState<Details>({
    orderType: enabledTypes[0] ?? "dine_in",
    tableNumber: "",
    customerName: "",
    deliveryAddress: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<PreparedOrder | null>(null);
  const [opened, setOpened] = useState(false);
  const [pending, startTransition] = useTransition();

  const price = (minor: number) => formatPrice(fromMinorUnits(minor), currency);
  const set = <K extends keyof Details>(key: K, value: Details[K]) => {
    setDetails((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const review = () => {
    setFormError(null);
    const nextErrors: Record<string, string> = {};
    if (priced.lines.length === 0) {
      setFormError("Your cart is empty. Add at least one item to order.");
      return;
    }
    if (details.orderType === "delivery" && !details.deliveryAddress.trim()) {
      nextErrors.deliveryAddress = "Enter your delivery address";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    startTransition(async () => {
      const result = await prepareWhatsAppOrderAction({
        slug,
        lines: priced.lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
        orderType: details.orderType,
        tableNumber: options.tableNumber && details.orderType === "dine_in" ? details.tableNumber : "",
        customerName: details.customerName,
        deliveryAddress: details.orderType === "delivery" ? details.deliveryAddress : "",
        notes: details.notes,
      });
      if (!result.ok) {
        setFormError(result.error);
        setErrors(result.fieldErrors ?? {});
        return;
      }
      setOpened(false);
      setPrepared(result.data);
    });
  };

  const close = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      setPrepared(null);
      setOpened(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92svh] w-full max-w-lg gap-0 rounded-t-2xl p-0 sm:bottom-4 sm:rounded-2xl sm:border"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            {prepared ? (
              <>
                <MessageCircle className="size-5 text-whatsapp" aria-hidden />
                Review & send on WhatsApp
              </>
            ) : (
              <>
                <ShoppingBag className="size-5 text-primary" aria-hidden />
                Your order
              </>
            )}
          </SheetTitle>
          <SheetDescription>
            {prepared
              ? "Check your message, then send it in WhatsApp."
              : `Ordering from ${restaurantName}`}
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto px-5 py-4">
          {prepared ? (
            <div className="grid gap-4">
              {prepared.removed.length > 0 && (
                <Alert>
                  <Info />
                  <AlertTitle>Some items were removed</AlertTitle>
                  <AlertDescription>
                    {prepared.removed.join(", ")} {prepared.removed.length === 1 ? "is" : "are"} no
                    longer available.
                  </AlertDescription>
                </Alert>
              )}
              <div>
                <p className="mb-1.5 text-sm font-medium">Message preview</p>
                <pre className="max-h-64 overflow-auto rounded-xl bg-[#e7f6e9] p-4 font-sans text-sm whitespace-pre-wrap text-[#10351c]">
                  {prepared.message.replace(/\*/g, "")}
                </pre>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                <span className="text-sm">Subtotal (checked against the menu)</span>
                <span className="font-semibold tabular-nums">{price(prepared.subtotalMinor)}</span>
              </div>
              <Alert>
                <Info />
                <AlertTitle>Your order isn&apos;t confirmed yet</AlertTitle>
                <AlertDescription>
                  WhatsApp opens with this message filled in. You need to tap <strong>Send</strong>{" "}
                  in WhatsApp, and your order is only confirmed once the restaurant replies.
                  {isDemo && (
                    <>
                      {" "}
                      <strong>This is a demo restaurant:</strong>{" "}
                      {prepared.hasRecipient
                        ? "the message goes to the demo number set up by the person showing you this product."
                        : "WhatsApp will ask you to choose a chat. No real restaurant receives it."}
                    </>
                  )}
                </AlertDescription>
              </Alert>
              {opened && (
                <div className="rounded-xl border border-dashed p-3 text-sm">
                  <p className="font-medium">Sent your message?</p>
                  <p className="text-muted-foreground">
                    Clear your cart once you&apos;ve sent the order in WhatsApp.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      onClear();
                      close(false);
                    }}
                  >
                    Clear cart
                  </Button>
                </div>
              )}
            </div>
          ) : priced.lines.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingBag className="mx-auto size-10 text-muted-foreground/50" aria-hidden />
              <p className="mt-3 font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Add something delicious from the menu.</p>
            </div>
          ) : (
            <div className="grid gap-5">
              <ul className="divide-y" aria-label="Items in your order">
                {priced.lines.map((line) => (
                  <li key={line.itemId} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug">{line.name}</p>
                      <p className="text-sm text-muted-foreground tabular-nums">
                        {price(line.unitMinor)} each
                      </p>
                    </div>
                    <QuantityStepper
                      name={line.name}
                      quantity={line.quantity}
                      onIncrement={() => onIncrement(line.itemId)}
                      onDecrement={() => onDecrement(line.itemId)}
                      disabled={pending}
                      size="sm"
                    />
                    <p className="w-20 text-right font-semibold tabular-nums">{price(line.totalMinor)}</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemove(line.itemId)}
                      aria-label={`Remove ${line.name}`}
                      disabled={pending}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium">Subtotal</span>
                <span className="text-lg font-semibold tabular-nums">{price(priced.subtotalMinor)}</span>
              </div>

              {enabledTypes.length > 1 && (
                <fieldset className="grid gap-2">
                  <legend className="mb-1 text-sm font-medium">Order type</legend>
                  <RadioGroup
                    value={details.orderType}
                    onValueChange={(v) => set("orderType", v as OrderType)}
                    className="grid grid-cols-3 gap-2"
                  >
                    {enabledTypes.map((type) => (
                      <label
                        key={type}
                        htmlFor={`type-${type}`}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2.5 text-sm font-medium has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
                      >
                        <RadioGroupItem id={`type-${type}`} value={type} className="sr-only" />
                        {ORDER_TYPE_LABELS[type]}
                      </label>
                    ))}
                  </RadioGroup>
                </fieldset>
              )}

              {details.orderType === "dine_in" && options.tableNumber && (
                <Field id="tableNumber" label="Table number" optional error={errors.tableNumber}>
                  <Input
                    {...fieldAria("tableNumber", errors.tableNumber)}
                    inputMode="numeric"
                    maxLength={LIMITS.tableNumberMax}
                    className="h-10"
                    value={details.tableNumber}
                    onChange={(e) => set("tableNumber", e.target.value)}
                  />
                </Field>
              )}

              <Field id="customerName" label="Your name" optional error={errors.customerName}>
                <Input
                  {...fieldAria("customerName", errors.customerName)}
                  autoComplete="name"
                  maxLength={LIMITS.customerNameMax}
                  className="h-10"
                  value={details.customerName}
                  onChange={(e) => set("customerName", e.target.value)}
                />
              </Field>

              {details.orderType === "delivery" && (
                <Field id="deliveryAddress" label="Delivery address" error={errors.deliveryAddress}>
                  <Textarea
                    {...fieldAria("deliveryAddress", errors.deliveryAddress)}
                    autoComplete="street-address"
                    rows={2}
                    maxLength={LIMITS.deliveryAddressMax}
                    value={details.deliveryAddress}
                    onChange={(e) => set("deliveryAddress", e.target.value)}
                  />
                </Field>
              )}

              <Field
                id="notes"
                label="Order notes"
                optional
                error={errors.notes}
                hint={`${details.notes.length}/${LIMITS.orderNotesMax}`}
              >
                <Textarea
                  {...fieldAria("notes", errors.notes, true)}
                  rows={2}
                  maxLength={LIMITS.orderNotesMax}
                  placeholder="e.g. No onions, extra sauce"
                  value={details.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </Field>

              {formError && (
                <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {formError}
                </p>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="border-t px-5 py-4">
          {prepared ? (
            <div className="grid gap-2">
              <Button
                asChild
                size="lg"
                className="h-12 bg-whatsapp text-base text-whatsapp-foreground hover:bg-whatsapp/90"
              >
                <a
                  href={prepared.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpened(true)}
                >
                  <MessageCircle aria-hidden />
                  Open WhatsApp to send
                </a>
              </Button>
              <Button variant="ghost" onClick={() => setPrepared(null)}>
                <ArrowLeft aria-hidden /> Edit order
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              className="h-12 bg-whatsapp text-base text-whatsapp-foreground hover:bg-whatsapp/90"
              disabled={pending || priced.lines.length === 0}
              onClick={review}
            >
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <MessageCircle aria-hidden />}
              Order on WhatsApp · {price(priced.subtotalMinor)}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
