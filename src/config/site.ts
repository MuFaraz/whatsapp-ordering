/** Product branding. Change these to rebrand the SaaS. */
export const siteConfig = {
  name: "MenuChat",
  shortName: "MenuChat",
  tagline: "QR menus & WhatsApp ordering for restaurants",
  description:
    "Create a beautiful digital menu, print a QR code for every table, and receive orders straight in WhatsApp. No apps, no commission.",
} as const;

/** The company behind the product (also sells custom websites & apps). */
export const companyConfig = {
  name: "DevFry Solutions",
  services: "Software · Websites · Mobile Apps",
} as const;

/** The built-in, read-only demo restaurant (served from local data). */
export const DEMO_SLUG = "bun-and-brew-demo";

export const SUPPORTED_CURRENCIES = ["PKR", "USD"] as const;

export const IMAGE_BUCKET = "menu-images";
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // must match the bucket limit
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const LIMITS = {
  categoriesPerRestaurant: 50,
  itemsPerRestaurant: 500,
  maxQuantityPerLine: 50,
  maxCartLines: 50,
  customerNameMax: 60,
  orderNotesMax: 300,
  tableNumberMax: 10,
  deliveryAddressMax: 200,
} as const;

export const pricing = {
  starter: {
    name: "Starter",
    priceLabel: "PKR 1,000",
    period: "/month",
  },
} as const;
