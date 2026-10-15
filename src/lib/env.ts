/**
 * Public environment configuration. NEXT_PUBLIC_* values are inlined at build
 * time, so they must be referenced literally (no dynamic `process.env[key]`).
 */

export function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !key || url.includes("your-project-ref")) return null;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export const publicEnv = {
  demoWhatsappNumber: process.env.NEXT_PUBLIC_DEMO_WHATSAPP_NUMBER?.trim() || "",
  salesWhatsappNumber:
    process.env.NEXT_PUBLIC_SALES_WHATSAPP_NUMBER?.trim() || "",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "",
};
