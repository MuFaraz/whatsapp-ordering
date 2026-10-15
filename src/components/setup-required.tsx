import { Settings2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Shown on account pages when Supabase environment variables are missing. */
export function SetupRequired({ feature = "Accounts" }: { feature?: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-secondary">
        <Settings2 className="size-6 text-primary" aria-hidden />
      </div>
      <h1 className="font-display text-xl font-semibold">Setup required</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {feature} need a Supabase project. Add{" "}
        <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-muted px-1">
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        </code>{" "}
        to your environment (see README), then restart or redeploy.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        The live demo works without any setup.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/demo">Open the demo</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
