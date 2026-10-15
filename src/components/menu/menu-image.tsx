"use client";

import { UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "cn";

/** Responsive menu image with a graceful fallback (never a broken image). */
export function MenuImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 40vw, 240px",
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = !src || failedSrc === src;

  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      {showFallback ? (
        <div className="flex size-full items-center justify-center text-secondary-foreground/40">
          <UtensilsCrossed className="size-1/3 max-h-10 max-w-10" aria-hidden />
          <span className="sr-only">{alt}</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          onError={() => setFailedSrc(src)}
        />
      )}
    </div>
  );
}
