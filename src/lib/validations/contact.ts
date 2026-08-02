import { z } from "zod";

export const contactSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(1, "Please enter a message.")
    .max(2000, "Message is too long."),
});

export type ContactInput = z.infer<typeof contactSchema>;
