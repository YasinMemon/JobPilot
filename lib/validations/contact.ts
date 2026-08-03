import { z } from "zod";
import { CONTACT_CATEGORIES } from "@/lib/public-content";

export const contactFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(80, "Full name must be 80 characters or fewer."),
  email: z.string().trim().email("Please enter a valid email address."),
  subject: z
    .string()
    .trim()
    .min(4, "Please add a subject for your message.")
    .max(120, "Subject must be 120 characters or fewer."),
  category: z.enum(CONTACT_CATEGORIES, {
    message: "Please choose a category.",
  }),
  message: z
    .string()
    .trim()
    .min(20, "Please add a few more details so we can help.")
    .max(4000, "Message must be 4000 characters or fewer."),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
