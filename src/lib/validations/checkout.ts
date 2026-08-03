import { z } from "zod";

// Lapiita Karya has no customer accounts (see src/auth.config.ts) — checkout
// is a guest flow, so this is the only place a shopper's contact details are
// collected.
// Shipping method choices shown in the checkout "Shipping" section.
// Distinct from the Biteship courier/service selection below — this is
// just the standard/express delivery-speed choice.
export const SHIPPING_METHODS = ["standard", "express"] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(120),
  phone: z.string().trim().min(1, "Phone number is required.").max(30),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  address: z.string().trim().min(1, "Shipping address is required.").max(500),
  notes: z.string().trim().max(500).optional(),
  shippingMethod: z.enum(SHIPPING_METHODS).default("standard"),
  // Selected Biteship shipping option (see
  // src/lib/checkout/shipping.ts::getCheckoutShippingRates /
  // src/lib/shipping/biteship.ts::ShippingRateOption). Distinct from
  // shippingMethod above — this is the actual priced courier/service the
  // customer picked, not the standard/express delivery-speed choice.
  courierCode: z.string().trim().min(1, "Select a shipping option."),
  courier: z.string().trim().min(1, "Select a shipping option."),
  service: z.string().trim().min(1, "Select a shipping option."),
  shippingCost: z.number().finite().nonnegative("Shipping cost is invalid."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
