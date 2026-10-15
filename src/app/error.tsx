"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Fallback for any route without its own error boundary. */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div role="alert" className="max-w-sm text-center">
        <TriangleAlert className="mx-auto size-10 text-destructive" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          Please try again. If it keeps happening, check your connection or come back in a few minutes.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>
            <RefreshCw aria-hidden /> Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
