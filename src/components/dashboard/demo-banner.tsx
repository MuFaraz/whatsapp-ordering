import { FlaskConical } from "lucide-react";
import Link from "next/link";

export function DemoBanner() {
  return (
    <div className="no-print border-b border-amber-300/60 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1">
        <FlaskConical className="size-4 shrink-0" aria-hidden />
        <p>
          <strong>Demo dashboard.</strong> This is sample data for a fictional
          restaurant. You can try every feature, but changes are not saved.
        </p>
        <Link href="/signup" className="font-semibold underline underline-offset-2">
          Create your own menu
        </Link>
      </div>
    </div>
  );
}
