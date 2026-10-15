"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, FolderPlus, Loader2, Pencil, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Field, fieldAria } from "@/components/form/field";
import { ImageUploadField } from "@/components/form/image-upload-field";
import { useUploadTracker } from "@/components/form/use-upload-tracker";
import { MenuImage } from "@/components/menu/menu-image";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { LIMITS } from "@/config/site";
import { formatPrice } from "@/lib/money";
import { menuItemSchema, type MenuItemInput } from "@/lib/validation";
import type { Currency, MenuCategory, MenuItem } from "@/types/database";
import { PageHeader } from "./dashboard-shell";
import { useDashboardOps } from "./ops-context";

type AvailabilityFilter = "all" | "available" | "unavailable";

export function MenuManager({
  initialItems,
  categories,
  currency,
  autoOpenNew,
  initialCategoryFilter,
}: {
  initialItems: MenuItem[];
  categories: MenuCategory[];
  currency: Currency;
  autoOpenNew?: boolean;
  initialCategoryFilter?: string;
}) {
  const ops = useDashboardOps();
  const [items, setItems] = useState(initialItems);
  const [prevInitial, setPrevInitial] = useState(initialItems);
  if (prevInitial !== initialItems) {
    setPrevInitial(initialItems);
    setItems(initialItems);
  }

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(
    initialCategoryFilter && categories.some((c) => c.id === initialCategoryFilter)
      ? initialCategoryFilter
      : "all",
  );
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [editing, setEditing] = useState<MenuItem | "new" | null>(
    autoOpenNew && categories.length > 0 ? "new" : null,
  );
  const [deleting, setDeleting] = useState<MenuItem | null>(null);
  const [pendingToggle, setPendingToggle] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );
  const categoryOrder = useMemo(
    () => new Map(categories.map((c, i) => [c.id, i])),
    [categories],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => categoryFilter === "all" || item.category_id === categoryFilter)
      .filter((item) =>
        availability === "all" ? true : availability === "available" ? item.is_available : !item.is_available,
      )
      .filter(
        (item) =>
          !q ||
          item.name.toLowerCase().includes(q) ||
          (item.description ?? "").toLowerCase().includes(q),
      )
      .sort(
        (a, b) =>
          (categoryOrder.get(a.category_id) ?? 0) - (categoryOrder.get(b.category_id) ?? 0) ||
          a.sort_order - b.sort_order ||
          a.created_at.localeCompare(b.created_at),
      );
  }, [items, query, categoryFilter, availability, categoryOrder]);

  // Reordering is offered when one category is shown without other filters,
  // so the visible list is exactly that category's full item order.
  const canReorder =
    categoryFilter !== "all" && availability === "all" && query.trim() === "";
  const [reordering, startReorder] = useTransition();

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (!canReorder || target < 0 || target >= filtered.length) return;
    const next = [...filtered];
    [next[index], next[target]] = [next[target]!, next[index]!];
    const orderById = new Map(next.map((item, i) => [item.id, i]));
    const previous = items;
    setItems((list) =>
      list.map((i) => (orderById.has(i.id) ? { ...i, sort_order: orderById.get(i.id)! } : i)),
    );
    startReorder(async () => {
      const result = await ops.reorderItems(categoryFilter, next.map((i) => i.id));
      if (!result.ok) {
        setItems(previous);
        toast.error(result.error);
      }
    });
  };

  const toggleAvailability = (item: MenuItem, value: boolean) => {
    setPendingToggle(item.id);
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, is_available: value } : i)));
    startTransition(async () => {
      const result = await ops.setAvailability(item.id, value);
      setPendingToggle(null);
      if (!result.ok) {
        setItems((list) => list.map((i) => (i.id === item.id ? { ...i, is_available: !value } : i)));
        toast.error(result.error);
      } else {
        toast.success(result.message ?? "Updated");
      }
    });
  };

  const atLimit = items.length >= LIMITS.itemsPerRestaurant;
  const noCategories = categories.length === 0;

  return (
    <>
      <PageHeader
        title="Menu items"
        description="Add dishes, set prices and mark items as sold out."
        actions={
          <Button onClick={() => setEditing("new")} disabled={noCategories || atLimit}>
            <Plus aria-hidden /> Add item
          </Button>
        }
      />

      {noCategories ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-secondary">
              <FolderPlus className="size-7 text-primary" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold">Create a category first</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Every menu item belongs to a category such as &quot;Burgers&quot; or &quot;Drinks&quot;.
            </p>
            <Button asChild className="mt-5">
              <Link href={`${ops.basePath}/categories?new=1`}>
                <FolderPlus aria-hidden /> Add a category
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items…"
                aria-label="Search menu items"
                className="h-10 bg-background pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10! w-full bg-background sm:w-48" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={availability} onValueChange={(v) => setAvailability(v as AvailabilityFilter)}>
              <SelectTrigger className="h-10! w-full bg-background sm:w-40" aria-label="Filter by availability">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-secondary">
                  <UtensilsCrossed className="size-7 text-primary" aria-hidden />
                </div>
                <h2 className="text-lg font-semibold">No menu items yet</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Add your first dish with a photo, description and price.
                </p>
                <Button className="mt-5" onClick={() => setEditing("new")}>
                  <Plus aria-hidden /> Add first item
                </Button>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="font-medium">No items match your filters.</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setQuery("");
                    setCategoryFilter("all");
                    setAvailability("all");
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="py-0">
              {!canReorder && categoryFilter === "all" && filtered.length > 1 && (
                <p className="border-b px-4 py-2 text-xs text-muted-foreground">
                  Tip: filter by one category to change the order items appear in.
                </p>
              )}
              <p className="sr-only" aria-live="polite">
                Showing {filtered.length} of {items.length} items
              </p>
              <ul className="divide-y">
                {filtered.map((item, index) => (
                  <li key={item.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                    {canReorder && (
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => moveItem(index, -1)}
                          disabled={index === 0 || reordering}
                          aria-label={`Move ${item.name} up`}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => moveItem(index, 1)}
                          disabled={index === filtered.length - 1 || reordering}
                          aria-label={`Move ${item.name} down`}
                        >
                          <ArrowDown />
                        </Button>
                      </div>
                    )}
                    <MenuImage
                      src={item.image_url}
                      alt=""
                      className="size-14 shrink-0 rounded-lg sm:size-16"
                      sizes="64px"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate font-semibold">{item.name}</p>
                        {!item.is_available && <Badge variant="secondary">Unavailable</Badge>}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {categoryName.get(item.category_id) ?? "Uncategorised"}
                        {item.description ? ` · ${item.description}` : ""}
                      </p>
                      <p className="text-sm font-semibold tabular-nums sm:hidden">
                        {formatPrice(item.price, currency)}
                      </p>
                    </div>
                    <p className="hidden w-24 text-right font-semibold tabular-nums sm:block">
                      {formatPrice(item.price, currency)}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Switch
                        checked={item.is_available}
                        disabled={pendingToggle === item.id}
                        onCheckedChange={(v) => toggleAvailability(item, v)}
                        aria-label={`${item.name} available`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(item)}
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleting(item)}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {atLimit && (
            <p className="mt-3 text-sm text-muted-foreground">
              You&apos;ve reached the limit of {LIMITS.itemsPerRestaurant} items.
            </p>
          )}
        </>
      )}

      <ItemDialog
        key={editing === "new" ? "new" : (editing?.id ?? "closed")}
        item={editing}
        categories={categories}
        currency={currency}
        defaultCategoryId={categoryFilter !== "all" ? categoryFilter : categories[0]?.id}
        onClose={() => setEditing(null)}
        onSaved={(saved, isNew) =>
          setItems((list) =>
            isNew
              ? [...list, saved]
              : list.map((i) =>
                  i.id === saved.id
                    ? { ...i, ...saved, sort_order: i.sort_order, created_at: i.created_at }
                    : i,
                ),
          )
        }
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleting?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the item from your menu permanently. To hide it temporarily, mark it
              unavailable instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const target = deleting;
                if (!target) return;
                startTransition(async () => {
                  const result = await ops.deleteItem(target.id);
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  setItems((list) => list.filter((i) => i.id !== target.id));
                  toast.success(result.message ?? "Item deleted");
                });
              }}
            >
              Delete item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ItemDialog({
  item,
  categories,
  currency,
  defaultCategoryId,
  onClose,
  onSaved,
}: {
  item: MenuItem | "new" | null;
  categories: MenuCategory[];
  currency: Currency;
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: (item: MenuItem, isNew: boolean) => void;
}) {
  const ops = useDashboardOps();
  const isNew = item === "new";
  const existing = item && item !== "new" ? item : null;
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const uploads = useUploadTracker(ops.discardImages);
  const cancel = () => {
    uploads.abandon();
    onClose();
  };

  const form = useForm<MenuItemInput>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: existing?.name ?? "",
      description: existing?.description ?? "",
      price: existing ? String(existing.price) : "",
      categoryId: existing?.category_id ?? defaultCategoryId ?? "",
      isAvailable: existing?.is_available ?? true,
      imageUrl: existing?.image_url ?? null,
    },
  });
  const { errors } = form.formState;
  const values = useWatch({ control: form.control });
  const previewPrice = Number(values.price);

  const onSubmit = form.handleSubmit((input) => {
    setFormError(null);
    startTransition(async () => {
      const result = isNew ? await ops.createItem(input) : await ops.updateItem(existing!.id, input);
      if (!result.ok) {
        setFormError(result.error);
        for (const [key, message] of Object.entries(result.fieldErrors ?? {})) {
          if (key in input) form.setError(key as keyof MenuItemInput, { message });
        }
        return;
      }
      toast.success(result.message ?? "Saved");
      uploads.commit([input.imageUrl]);
      onSaved(result.data, isNew);
      onClose();
    });
  });

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && cancel()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add menu item" : "Edit menu item"}</DialogTitle>
          <DialogDescription>Fields marked optional can be left empty.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <form id="item-form" onSubmit={onSubmit} className="grid gap-4" noValidate>
            {formError && (
              <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </p>
            )}
            <Field id="item-name" label="Name" error={errors.name?.message}>
              <Input
                {...fieldAria("item-name", errors.name?.message)}
                className="h-10"
                placeholder="e.g. Chicken Tikka Pizza"
                {...form.register("name")}
              />
            </Field>
            <Field id="item-description" label="Description" optional error={errors.description?.message}>
              <Textarea
                {...fieldAria("item-description", errors.description?.message)}
                rows={3}
                maxLength={300}
                placeholder="Ingredients, portion size or allergens"
                {...form.register("description")}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="item-price"
                label={`Price (${currency})`}
                error={errors.price?.message}
              >
                <Input
                  {...fieldAria("item-price", errors.price?.message)}
                  className="h-10"
                  inputMode="decimal"
                  placeholder={currency === "PKR" ? "850" : "12.50"}
                  {...form.register("price")}
                />
              </Field>
              <Field id="item-category" label="Category" error={errors.categoryId?.message}>
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="item-category"
                        className="h-10! w-full"
                        aria-invalid={errors.categoryId ? true : undefined}
                      >
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <Controller
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <label
                  htmlFor="item-available"
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-3"
                >
                  <span>
                    <span className="block text-sm font-medium">Available to order</span>
                    <span className="block text-sm text-muted-foreground">
                      Turn off when an item is sold out.
                    </span>
                  </span>
                  <Switch id="item-available" checked={field.value} onCheckedChange={field.onChange} />
                </label>
              )}
            />
            <Controller
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <ImageUploadField
                  label="Photo"
                  value={field.value}
                  onChange={field.onChange}
                  upload={(file) => ops.uploadImage(file, "item").then(uploads.track)}
                />
              )}
            />
          </form>

          <aside aria-label="Preview" className="grid content-start gap-2">
            <p className="text-sm font-medium">Customer preview</p>
            <div className="rounded-2xl bg-muted/60 p-3">
              <MenuItemCard
                preview
                currency={currency}
                item={{
                  id: "preview",
                  name: values.name || "Item name",
                  description: values.description || null,
                  price: Number.isFinite(previewPrice) ? previewPrice : 0,
                  image_url: values.imageUrl ?? null,
                  is_available: values.isAvailable ?? true,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This is how the item appears on your public menu.
            </p>
          </aside>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={cancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="item-form" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {isNew ? "Add item" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
