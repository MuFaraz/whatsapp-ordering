import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MenuNotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-secondary">
          <UtensilsCrossed className="size-7 text-primary" aria-hidden />
        </div>
        <h1 className="font-display text-2xl font-semibold">This menu isn&apos;t available</h1>
        <p className="mt-2 text-muted-foreground">
          The link may be incorrect, or the restaurant has hidden its menu for now. Please ask a
          member of staff.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">Go to homepage</Link>
        </Button>
      </div>
    </main>
  );
}
