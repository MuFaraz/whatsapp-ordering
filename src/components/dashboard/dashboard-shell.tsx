"use client";

import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  QrCode,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "cn";
import { LogoMark } from "@/components/brand/logo";
import { MenuImage } from "@/components/menu/menu-image";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { signOutAction } from "@/lib/actions/auth";

type ShellRestaurant = { name: string; slug: string; logo_url: string | null };

const NAV = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/menu", label: "Menu items", icon: UtensilsCrossed },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/qr-code", label: "QR code", icon: QrCode },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({
  basePath,
  onNavigate,
}: {
  basePath: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="grid gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const target = `${basePath}${href}`;
        const active =
          href === "" ? pathname === basePath : pathname.startsWith(target);
        return (
          <Link
            key={label}
            href={target}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  restaurant,
  basePath,
  isDemo,
  onNavigate,
}: {
  restaurant: ShellRestaurant;
  basePath: string;
  isDemo: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link
        href={basePath}
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-lg px-1 font-display text-base font-semibold"
      >
        <LogoMark className="size-7" />
        {siteConfig.name}
      </Link>

      <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
        <MenuImage
          src={restaurant.logo_url}
          alt={`${restaurant.name} logo`}
          className="size-10 shrink-0 rounded-lg"
          sizes="40px"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{restaurant.name}</p>
          <p className="truncate text-xs text-muted-foreground">/menu/{restaurant.slug}</p>
        </div>
      </div>

      <NavLinks basePath={basePath} onNavigate={onNavigate} />

      <div className="mt-auto grid gap-2">
        <Button asChild variant="outline" className="justify-start">
          <a href={`/menu/${restaurant.slug}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            View public menu
          </a>
        </Button>
        {isDemo ? (
          <Button asChild variant="ghost" className="justify-start">
            <Link href="/demo">
              <LogOut aria-hidden />
              Exit demo
            </Link>
          </Button>
        ) : (
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" className="w-full justify-start">
              <LogOut aria-hidden />
              Log out
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export function DashboardShell({
  restaurant,
  basePath,
  isDemo = false,
  banner,
  children,
}: {
  restaurant: ShellRestaurant;
  basePath: string;
  isDemo?: boolean;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-svh bg-muted/40 print:bg-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block print:hidden">
        <SidebarBody restaurant={restaurant} basePath={basePath} isDemo={isDemo} />
      </aside>

      <div className="lg:pl-64 print:pl-0">
        {banner}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:hidden print:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0" showCloseButton>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Dashboard sections</SheetDescription>
              <SidebarBody
                restaurant={restaurant}
                basePath={basePath}
                isDemo={isDemo}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <p className="truncate font-semibold">{restaurant.name}</p>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
