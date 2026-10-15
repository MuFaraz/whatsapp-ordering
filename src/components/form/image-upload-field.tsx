"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "cn";
import { MenuImage } from "@/components/menu/menu-image";
import { Button } from "@/components/ui/button";

/**
 * Image picker that uploads immediately and reports the resulting URL.
 * `upload` is injected so the same control works in live and demo mode.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  upload,
  aspect = "aspect-[4/3]",
  hint = "JPG, PNG or WebP. Large photos are resized automatically.",
  disabled,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  upload: (file: File) => Promise<string>;
  aspect?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await upload(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label} <span className="font-normal text-muted-foreground">(optional)</span>
      </label>
      <div className="flex items-start gap-4">
        <div className={cn("relative w-32 shrink-0 overflow-hidden rounded-xl border", aspect)}>
          <MenuImage src={value} alt={`${label} preview`} className="absolute inset-0" sizes="128px" />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="size-5 animate-spin" aria-label="Uploading" />
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={disabled || busy}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus aria-hidden />
              {value ? "Replace" : "Upload"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || busy}
                onClick={() => onChange(null)}
              >
                <Trash2 aria-hidden />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
