import { ExternalLink } from "lucide-react";
import { normalizePhoneNumber, toWhatsAppDigits } from "@/lib/phone";

/** Shows the normalised number and a link to test it in WhatsApp. */
export function WhatsappHint({ value }: { value: string }) {
  const normalized = normalizePhoneNumber(value ?? "");
  if (!normalized) return null;
  const digits = toWhatsAppDigits(normalized);
  return (
    <p className="text-sm text-muted-foreground">
      Orders will open a chat with <strong className="text-foreground">{normalized}</strong>.{" "}
      <a
        href={`https://wa.me/${digits}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
      >
        Test this number <ExternalLink className="size-3" aria-hidden />
      </a>
    </p>
  );
}
