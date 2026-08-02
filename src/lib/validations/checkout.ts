import { z } from "zod";

// Lapiita Karya has no customer accounts (see src/auth.config.ts) — checkout
// is a guest flow, so this is the only place a shopper's contact details are
// collected.
export const checkoutSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(120),
  phone: z.string().trim().min(1, "Phone number is required.").max(30),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  address: z.string().trim().min(1, "Shipping address is required.").max(500),
  notes: z.string().trim().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
