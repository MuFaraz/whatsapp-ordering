import { z } from "zod";
import { LIMITS, SUPPORTED_CURRENCIES } from "@/config/site";
import { normalizePhoneNumber } from "@/lib/phone";
import { getSlugProblem } from "@/lib/slug";

/*
 * Shared Zod schemas. The same schemas validate forms in the browser (UX) and
 * re-validate every Server Action input (security). Schemas used by forms keep
 * identical input/output types (no transforms) so react-hook-form stays simple;
 * server code converts strings (e.g. price) after parsing.
 */

const optionalText = (max: number, label = "This field") =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer`);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email("Enter a valid email address"));

// ---------------------------------------------------------------- auth

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(100, "Name is too long"),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(72, "Use 72 characters or fewer"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(72),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(72, "Use 72 characters or fewer"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ---------------------------------------------------------------- restaurant

export const restaurantNameSchema = z
  .string()
  .trim()
  .min(2, "Restaurant name must be at least 2 characters")
  .max(80, "Restaurant name must be 80 characters or fewer");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .superRefine((value, ctx) => {
    const problem = getSlugProblem(value);
    if (problem === "format") {
      ctx.addIssue({
        code: "custom",
        message:
          "Use 3–48 lowercase letters, numbers and single hyphens (no hyphen at the start or end)",
      });
    } else if (problem === "reserved") {
      ctx.addIssue({ code: "custom", message: "This link is reserved" });
    }
  });

export const whatsappSchema = z
  .string()
  .trim()
  .refine((value) => normalizePhoneNumber(value) !== null, {
    message:
      "Enter the full number with country code, e.g. +92 300 1234567",
  });

export const currencySchema = z.enum(SUPPORTED_CURRENCIES, {
  error: "Choose a currency",
});

export const restaurantCreateSchema = z.object({
  name: restaurantNameSchema,
  slug: slugSchema,
  whatsappNumber: whatsappSchema,
  currency: currencySchema,
});
export type RestaurantCreateInput = z.infer<typeof restaurantCreateSchema>;

const imageUrlSchema = z.string().trim().max(1000).nullable();

export const restaurantSettingsSchema = z
  .object({
    name: restaurantNameSchema,
    slug: slugSchema,
    description: optionalText(500, "Description"),
    whatsappNumber: whatsappSchema,
    contactPhone: optionalText(30, "Phone"),
    contactEmail: z
      .string()
      .trim()
      .max(254)
      .refine((v) => v === "" || z.email().safeParse(v).success, {
        message: "Enter a valid email address",
      }),
    address: optionalText(200, "Address"),
    currency: currencySchema,
    isPublished: z.boolean(),
    acceptsDineIn: z.boolean(),
    acceptsTakeaway: z.boolean(),
    acceptsDelivery: z.boolean(),
    tableNumberEnabled: z.boolean(),
    logoUrl: imageUrlSchema,
    coverUrl: imageUrlSchema,
  })
  .refine((v) => v.acceptsDineIn || v.acceptsTakeaway || v.acceptsDelivery, {
    message: "Enable at least one order type",
    path: ["acceptsDineIn"],
  });
export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>;

export const restaurantBrandingSchema = z.object({
  description: optionalText(500, "Description"),
  logoUrl: imageUrlSchema,
});
export type RestaurantBrandingInput = z.infer<typeof restaurantBrandingSchema>;

// ---------------------------------------------------------------- menu

export const idSchema = z.string().trim().min(1).max(64);

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a category name")
    .max(60, "Category name must be 60 characters or fewer"),
  description: optionalText(200, "Description"),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const priceSchema = z
  .string()
  .trim()
  .min(1, "Enter a price")
  .regex(
    /^\d{1,7}(\.\d{1,2})?$/,
    "Enter a valid price with up to 2 decimals, e.g. 850 or 12.50",
  )
  .refine((v) => Number(v) <= 1_000_000, "Price must be 1,000,000 or less");

export const menuItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter an item name")
    .max(80, "Item name must be 80 characters or fewer"),
  description: optionalText(300, "Description"),
  price: priceSchema,
  categoryId: z.string().min(1, "Choose a category").max(64),
  isAvailable: z.boolean(),
  imageUrl: imageUrlSchema,
});
export type MenuItemInput = z.infer<typeof menuItemSchema>;

// ---------------------------------------------------------------- orders

export const orderTypeSchema = z.enum(["dine_in", "takeaway", "delivery"]);

export const orderDetailsSchema = z.object({
  orderType: orderTypeSchema,
  tableNumber: optionalText(LIMITS.tableNumberMax, "Table number"),
  customerName: optionalText(LIMITS.customerNameMax, "Name"),
  deliveryAddress: optionalText(LIMITS.deliveryAddressMax, "Address"),
  notes: optionalText(LIMITS.orderNotesMax, "Notes"),
});
export type OrderDetailsInput = z.infer<typeof orderDetailsSchema>;

export const orderRequestSchema = orderDetailsSchema.extend({
  slug: z.string().trim().min(1).max(64),
  lines: z
    .array(
      z.object({
        itemId: idSchema,
        quantity: z.number().int().min(1).max(LIMITS.maxQuantityPerLine),
      }),
    )
    .min(1, "Your cart is empty")
    .max(LIMITS.maxCartLines),
});
export type OrderRequestInput = z.infer<typeof orderRequestSchema>;

/** Flattens Zod errors into `{ field: message }` for form display. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
