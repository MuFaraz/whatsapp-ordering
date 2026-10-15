"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";

/** Sticky, horizontally scrollable category chips with scroll-spy. */
export function CategoryNav({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [active, setActive] = useState<string | null>(categories[0]?.id ?? null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`category-${c.id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("category-", ""));
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  // Keep the active chip visible in the horizontal scroller.
  useEffect(() => {
    if (!active) return;
    const chip = navRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    chip?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  if (categories.length < 2) return null;

  return (
    <nav
      ref={navRef}
      aria-label="Menu categories"
      className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 backdrop-blur sm:mx-0 sm:rounded-b-xl sm:px-2"
    >
      <ul className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <li key={c.id} className="shrink-0">
            <a
              href={`#category-${c.id}`}
              data-id={c.id}
              aria-current={active === c.id ? "true" : undefined}
              onClick={() => setActive(c.id)}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                active === c.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-muted",
              )}
            >
              {c.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
