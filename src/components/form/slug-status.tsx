import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { SlugStatus } from "./use-slug-availability";

export function SlugStatusHint({ status }: { status: SlugStatus }) {
  if (status.state === "idle") return null;
  return (
    <p className="flex items-center gap-1.5 text-sm" aria-live="polite">
      {status.state === "checking" && (
        <>
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">Checking availability…</span>
        </>
      )}
      {status.state === "available" && (
        <>
          <CheckCircle2 className="size-3.5 text-success" aria-hidden />
          <span className="text-success">This link is available</span>
        </>
      )}
      {status.state === "taken" && (
        <>
          <XCircle className="size-3.5 text-destructive" aria-hidden />
          <span className="text-destructive">This link is already taken</span>
        </>
      )}
      {status.state === "error" && (
        <span className="text-muted-foreground">{status.message}</span>
      )}
    </p>
  );
}
