import {
  CheckCircle2,
  CircleAlert,
  Download,
  ExternalLink,
  FolderPlus,
  FolderTree,
  Plus,
  QrCode,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { MenuImage } from "@/components/menu/menu-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/money";
import type { MenuCategory, MenuItem, Restaurant } from "@/types/database";
import { PageHeader } from "./dashboard-shell";

function StatCard({
  label,
  value,
  icon: Icon,
  detail,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  detail?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
          {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
          <Icon className="size-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

function relativeTime(iso: string, now: number) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export function OverviewView({
  restaurant,
  categories,
  items,
  basePath,
  now,
}: {
  restaurant: Pick<Restaurant, "name" | "slug" | "currency" | "is_published" | "logo_url">;
  categories: MenuCategory[];
  items: MenuItem[];
  basePath: string;
  /** Request time, passed in so server and client render identically. */
  now: number;
}) {
  const available = items.filter((i) => i.is_available).length;
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const recent = [...items]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);
  const menuHref = `/menu/${restaurant.slug}`;

  const checklist = [
    { done: categories.length > 0, label: "Create your first category", href: `${basePath}/categories` },
    { done: items.length > 0, label: "Add menu items with prices", href: `${basePath}/menu` },
    { done: Boolean(restaurant.logo_url), label: "Add your logo", href: `${basePath}/settings` },
  ];
  const setupComplete = checklist.every((c) => c.done);

  return (
    <>
      <PageHeader
        title={`Welcome to ${restaurant.name}`}
        description="Here's how your digital menu looks today."
        actions={
          <Button asChild variant="outline">
            <a href={menuHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden />
              Preview menu
            </a>
          </Button>
        }
      />

      <section aria-label="Menu statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Categories" value={categories.length} icon={FolderTree} />
        <StatCard label="Menu items" value={items.length} icon={UtensilsCrossed} />
        <StatCard
          label="Available items"
          value={available}
          icon={CheckCircle2}
          detail={items.length > 0 ? `${items.length - available} marked unavailable` : undefined}
        />
        <StatCard
          label="Public menu"
          value={
            restaurant.is_published ? (
              <Badge className="bg-success text-success-foreground">Live</Badge>
            ) : (
              <Badge variant="secondary">Hidden</Badge>
            )
          }
          icon={restaurant.is_published ? CheckCircle2 : CircleAlert}
          detail={
            restaurant.is_published
              ? "Customers can view your menu"
              : "Turn it on in Settings"
          }
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>The things you&apos;ll do most often.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Button asChild variant="outline" className="h-11 justify-start">
              <Link href={`${basePath}/menu?new=1`}>
                <Plus aria-hidden /> Add menu item
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 justify-start">
              <Link href={`${basePath}/categories?new=1`}>
                <FolderPlus aria-hidden /> Add category
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 justify-start">
              <a href={menuHref} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden /> Preview menu
              </a>
            </Button>
            <Button asChild variant="outline" className="h-11 justify-start">
              <Link href={`${basePath}/qr-code`}>
                <Download aria-hidden /> Download QR code
              </Link>
            </Button>
          </CardContent>
        </Card>

        {!setupComplete ? (
          <Card>
            <CardHeader>
              <CardTitle>Finish setting up</CardTitle>
              <CardDescription>A few steps and your menu is ready for customers.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-2">
                {checklist.map((step) => (
                  <li key={step.label}>
                    <Link
                      href={step.href}
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                    >
                      {step.done ? (
                        <CheckCircle2 className="size-5 text-success" aria-label="Done" />
                      ) : (
                        <span className="size-5 rounded-full border-2" aria-label="Not done" />
                      )}
                      <span className={step.done ? "text-muted-foreground line-through" : "font-medium"}>
                        {step.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recently updated items</CardTitle>
              <CardDescription>Your latest menu changes.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {recent.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <MenuImage src={item.image_url} alt="" className="size-10 shrink-0 rounded-lg" sizes="40px" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {categoryName.get(item.category_id) ?? "Uncategorised"} ·{" "}
                        {formatPrice(item.price, restaurant.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      {!item.is_available && (
                        <Badge variant="secondary" className="mb-1">Unavailable</Badge>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {relativeTime(item.updated_at, now)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <QrCode className="size-6" aria-hidden />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Put your menu on every table</p>
            <p className="text-sm text-muted-foreground">
              Download a print-ready QR code that opens your menu at{" "}
              <span className="font-medium text-foreground">{menuHref}</span>.
            </p>
          </div>
          <Button asChild>
            <Link href={`${basePath}/qr-code`}>Get QR code</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
