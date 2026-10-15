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
      <path d="M8 16.5C8 11.3 11.6 8.5 16 8.5S24 11.3 24 16.5Z" fill="#FFE2BC" />
      <rect x="7.5" y="18" width="17" height="3" rx="1.5" fill="#5E321A" />
      <path d="M8.5 22.5H23.5C23.5 24.4 22.4 25 21 25H11C9.6 25 8.5 24.4 8.5 22.5Z" fill="#FFE2BC" />
      <g fill="var(--primary)">
        <ellipse cx="13" cy="12.6" rx="1" ry=".55" />
        <ellipse cx="16.2" cy="11.4" rx="1" ry=".55" />
        <ellipse cx="19.2" cy="12.8" rx="1" ry=".55" />
      </g>
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
