import Link from "next/link";
import { cn } from "cn";
import { siteConfig } from "@/config/site";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <path d="M8 8.5h16a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5h-9l-4.5 3.5v-3.5H8a2.5 2.5 0 0 1-2.5-2.5v-9A2.5 2.5 0 0 1 8 8.5Z" fill="#FFF7EF" />
      <rect x="9.5" y="12" width="9" height="2" rx="1" fill="var(--primary)" />
      <rect x="9.5" y="16" width="13" height="2" rx="1" fill="var(--primary)" opacity=".7" />
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg font-display text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark />
      <span>{siteConfig.name}</span>
    </Link>
  );
}
