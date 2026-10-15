import { Skeleton } from "@/components/ui/skeleton";

export default function MenuLoading() {
  return (
    <div aria-busy="true" aria-label="Loading menu">
      <Skeleton className="h-40 w-full rounded-none sm:h-56" />
      <div className="mx-auto max-w-3xl px-4">
        <Skeleton className="-mt-12 size-24 rounded-2xl border-4 border-background" />
        <Skeleton className="mt-4 h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        <div className="mt-6 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
