"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MenuError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div role="alert" className="max-w-sm text-center">
        <WifiOff className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-semibold">We couldn&apos;t load the menu</h1>
        <p className="mt-2 text-muted-foreground">
          Please check your internet connection and try again.
        </p>
        <Button className="mt-6" onClick={reset}>
          <RefreshCw aria-hidden /> Try again
        </Button>
      </div>
    </main>
  );
}
