"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, FolderPlus, Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field, fieldAria } from "@/components/form/field";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/config/site";
import { categorySchema, type CategoryInput } from "@/lib/validation";
import type { MenuCategory } from "@/types/database";
import { PageHeader } from "./dashboard-shell";
import { clearNewParam } from "./clear-new-param";
import { useDashboardOps, type DeleteCategoryOptions } from "./ops-context";

type Props = {
  initialCategories: MenuCategory[];
  /** category id -> number of items */
  initialCounts: Record<string, number>;
  autoOpenNew?: boolean;
};

export function CategoryManager({ initialCategories, initialCounts, autoOpenNew }: Props) {
  const ops = useDashboardOps();
  const [categories, setCategories] = useState(initialCategories);
  const [counts, setCounts] = useState(initialCounts);
  // Re-sync when the server sends fresh data (after router.refresh()).
  const [prevInitial, setPrevInitial] = useState(initialCategories);
  if (prevInitial !== initialCategories) {
    setPrevInitial(initialCategories);
    setCategories(initialCategories);
    setCounts(initialCounts);
  }

  const [editing, setEditing] = useState<MenuCategory | "new" | null>(autoOpenNew ? "new" : null);
  const [deleting, setDeleting] = useState<MenuCategory | null>(null);
  const [reordering, startReorder] = useTransition();

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target]!, next[index]!];
    const previous = categories;
    setCategories(next);
    startReorder(async () => {
      const result = await ops.reorderCategories(next.map((c) => c.id));
      if (!result.ok) {
        setCategories(previous);
        toast.error(result.error);
      }
    });
  };

  const atLimit = categories.length >= LIMITS.categoriesPerRestaurant;

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group your menu into sections. Customers see them in this order."
        actions={
          <Button onClick={() => setEditing("new")} disabled={atLimit}>
            <FolderPlus aria-hidden /> Add category
          </Button>
        }
      />

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-secondary">
              <FolderPlus className="size-7 text-primary" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold">No categories yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Start with sections like &quot;Burgers&quot;, &quot;Drinks&quot; or &quot;Desserts&quot;.
              You&apos;ll add menu items to them next.
            </p>
            <Button className="mt-5" onClick={() => setEditing("new")}>
              <FolderPlus aria-hidden /> Create first category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <ol className="divide-y" aria-busy={reordering}>
            {categories.map((category, index) => (
              <li key={category.id} className="flex items-center gap-3 p-3 sm:p-4">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reordering}
                    aria-label={`Move ${category.name} up`}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => move(index, 1)}
                    disabled={index === categories.length - 1 || reordering}
                    aria-label={`Move ${category.name} down`}
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{category.name}</p>
                    <Badge variant="secondary">
                      {counts[category.id] ?? 0} {(counts[category.id] ?? 0) === 1 ? "item" : "items"}
                    </Badge>
                  </div>
                  {category.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                  <Link
                    href={`${ops.basePath}/menu?category=${category.id}`}
                    className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    View items
                  </Link>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(category)}
                    aria-label={`Edit ${category.name}`}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleting(category)}
                    aria-label={`Delete ${category.name}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
      {atLimit && (
        <p className="mt-3 text-sm text-muted-foreground">
          You&apos;ve reached the limit of {LIMITS.categoriesPerRestaurant} categories.
        </p>
      )}

      <CategoryDialog
        key={editing === "new" ? "new" : (editing?.id ?? "closed")}
        category={editing}
        onClose={() => {
          setEditing(null);
          clearNewParam();
        }}
        onSaved={(saved, isNew) => {
          setCategories((list) =>
            isNew
              ? [...list, saved]
              : list.map((c) => (c.id === saved.id ? { ...c, name: saved.name, description: saved.description } : c)),
          );
          if (isNew) setCounts((c) => ({ ...c, [saved.id]: 0 }));
        }}
      />

      <DeleteCategoryDialog
        key={deleting?.id ?? "none"}
        category={deleting}
        itemCount={deleting ? (counts[deleting.id] ?? 0) : 0}
        otherCategories={categories.filter((c) => c.id !== deleting?.id)}
        onClose={() => setDeleting(null)}
        onDeleted={(id, options) => {
          setCategories((list) => list.filter((c) => c.id !== id));
          setCounts((c) => {
            const next = { ...c };
            if (options.strategy === "move-items") {
              next[options.targetCategoryId] =
                (next[options.targetCategoryId] ?? 0) + (next[id] ?? 0);
            }
            delete next[id];
            return next;
          });
        }}
      />
    </>
  );
}

function CategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category: MenuCategory | "new" | null;
  onClose: () => void;
  onSaved: (category: MenuCategory, isNew: boolean) => void;
}) {
  const ops = useDashboardOps();
  const isNew = category === "new";
  const existing = category && category !== "new" ? category : null;
  const [pending, startTransition] = useTransition();

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: existing?.name ?? "",
      description: existing?.description ?? "",
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = isNew
        ? await ops.createCategory(values)
        : await ops.updateCategory(existing!.id, values);
      if (!result.ok) {
        for (const [key, message] of Object.entries(result.fieldErrors ?? {})) {
          if (key === "name" || key === "description") form.setError(key, { message });
        }
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Saved");
      onSaved(result.data, isNew);
      onClose();
    });
  });

  return (
    <Dialog open={category !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? "New category" : "Edit category"}</DialogTitle>
          <DialogDescription>
            {isNew ? "Add a new section to your menu." : "Update the name or description."}
          </DialogDescription>
        </DialogHeader>
        <form id="category-form" onSubmit={onSubmit} className="grid gap-4" noValidate>
          <Field id="category-name" label="Name" error={errors.name?.message}>
            <Input
              {...fieldAria("category-name", errors.name?.message)}
              className="h-10"
              placeholder="e.g. Burgers"
              autoFocus
              {...form.register("name")}
            />
          </Field>
          <Field
            id="category-description"
            label="Description"
            optional
            error={errors.description?.message}
          >
            <Textarea
              {...fieldAria("category-description", errors.description?.message)}
              rows={2}
              maxLength={200}
              placeholder="Shown under the category name on your menu"
              {...form.register("description")}
            />
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {isNew ? "Create category" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryDialog({
  category,
  itemCount,
  otherCategories,
  onClose,
  onDeleted,
}: {
  category: MenuCategory | null;
  itemCount: number;
  otherCategories: MenuCategory[];
  onClose: () => void;
  onDeleted: (id: string, options: DeleteCategoryOptions) => void;
}) {
  const ops = useDashboardOps();
  const [pending, startTransition] = useTransition();
  const [strategy, setStrategy] = useState<"move-items" | "delete-items">(
    otherCategories.length > 0 ? "move-items" : "delete-items",
  );
  const [target, setTarget] = useState<string>(otherCategories[0]?.id ?? "");
  const hasItems = itemCount > 0;

  const confirm = () => {
    if (!category) return;
    const options: DeleteCategoryOptions = !hasItems
      ? { strategy: "empty-only" }
      : strategy === "move-items"
        ? { strategy: "move-items", targetCategoryId: target }
        : { strategy: "delete-items" };
    startTransition(async () => {
      const result = await ops.deleteCategory(category.id, options);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Category deleted");
      onDeleted(category.id, options);
      onClose();
    });
  };

  const canConfirm = !hasItems || strategy === "delete-items" || Boolean(target);

  return (
    <Dialog open={category !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete &quot;{category?.name}&quot;?</DialogTitle>
          <DialogDescription>
            {hasItems
              ? `This category has ${itemCount} ${itemCount === 1 ? "item" : "items"}. Choose what happens to them.`
              : "This category is empty and will be removed from your menu."}
          </DialogDescription>
        </DialogHeader>

        {hasItems && (
          <RadioGroup
            value={strategy}
            onValueChange={(v) => setStrategy(v as typeof strategy)}
            className="grid gap-3"
          >
            <label
              htmlFor="strategy-move"
              className="grid cursor-pointer gap-2 rounded-xl border p-3 has-[[data-state=checked]]:border-primary"
            >
              <span className="flex items-center gap-2 font-medium">
                <RadioGroupItem id="strategy-move" value="move-items" disabled={otherCategories.length === 0} />
                Move items to another category
              </span>
              {otherCategories.length > 0 ? (
                <Select value={target} onValueChange={setTarget} disabled={strategy !== "move-items"}>
                  <SelectTrigger className="w-full" aria-label="Target category">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Create another category first to move items.
                </span>
              )}
            </label>
            <label
              htmlFor="strategy-delete"
              className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 font-medium has-[[data-state=checked]]:border-destructive"
            >
              <RadioGroupItem id="strategy-delete" value="delete-items" />
              Delete the category and its {itemCount} {itemCount === 1 ? "item" : "items"}
            </label>
          </RadioGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending || !canConfirm}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {hasItems && strategy === "move-items" ? "Move items & delete" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
