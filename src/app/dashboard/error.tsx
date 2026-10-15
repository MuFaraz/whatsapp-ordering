"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-2xl border bg-card p-6 text-center">
      <TriangleAlert className="mx-auto size-8 text-destructive" aria-hidden />
      <h1 className="mt-3 text-lg font-semibold">Something went wrong</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We couldn&apos;t load this page. Check your connection and try again.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <Button className="mt-4" onClick={reset}>
        <RefreshCw aria-hidden /> Try again
      </Button>
    </div>
  );
}
