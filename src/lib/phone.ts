/**
 * Normalises a phone number to E.164 (`+<country><number>`, 8–15 digits).
 * Accepts common user input such as "+92 300 1234567", "0092-300-1234567" or
 * "(+1) 415 555 0100". Returns null when the result is not a plausible
 * international number. Local numbers without a country code are rejected on
 * purpose: we can't guess the country.
 */
export function normalizePhoneNumber(input: string): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Only digits, spaces, dashes, dots, parentheses and a leading + are allowed.
  if (!/^[+\d\s\-().]+$/.test(trimmed)) return null;

  let digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.indexOf("+") > 0 || (digits.match(/\+/g) ?? []).length > 1) {
    return null;
  }

  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else {
    return null;
  }

  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return `+${digits}`;
}

/** Digits-only form used by wa.me links (no "+", no leading zeros). */
export function toWhatsAppDigits(e164: string): string | null {
  const normalized = normalizePhoneNumber(e164);
  return normalized ? normalized.slice(1) : null;
}

