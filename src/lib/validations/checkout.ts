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
  // Client-submitted shipping cost is only used to identify *which* quoted
  // rate the customer picked (matched against a fresh server-side quote in
  // placeOrder, see src/lib/checkout/actions.ts) — it is never trusted as
  // the actual amount charged, since a tampered request body could
  // otherwise understate or zero out shipping.
  shippingCost: z.number().finite().nonnegative("Shipping cost is invalid."),
  // Biteship Area ID for the customer's selected postal code (see
  // CheckoutDestination in src/lib/checkout/shipping.ts). Required so
  // placeOrder can re-fetch live rates for this exact destination rather
  // than trusting the client's shippingCost.
  areaId: z.string().trim().min(1, "Select a postal code to calculate shipping."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
