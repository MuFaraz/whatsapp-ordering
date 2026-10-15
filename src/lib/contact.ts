import { siteConfig } from "@/config/site";
import { publicEnv } from "@/lib/env";
import { buildWhatsAppUrl } from "@/lib/order/whatsapp";
import { normalizePhoneNumber } from "@/lib/phone";

/** Sales contact links from env; null when not configured (no dead links). */
export function getContactLinks(topic = "setting up a QR menu for my restaurant") {
  const phone = normalizePhoneNumber(publicEnv.salesWhatsappNumber);
  return {
    whatsapp: phone
      ? buildWhatsAppUrl(
          phone,
          `Hi! I'm interested in ${siteConfig.name}: ${topic}.`,
        )
      : null,
    email: publicEnv.contactEmail
      ? `mailto:${publicEnv.contactEmail}?subject=${encodeURIComponent(`${siteConfig.name} enquiry`)}`
      : null,
  };
}
