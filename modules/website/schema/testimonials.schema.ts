import { z } from "zod";

export const testimonialSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(150, "Name must be at most 150 characters"),

  role: z
    .string()
    .trim()
    .min(1, "Role is required")
    .max(150, "Role must be at most 150 characters"),

  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(2000, "Message must be at most 2000 characters"),

  image_id: z.string().uuid("Image is required"),
});

export type TestimonialValues = z.infer<typeof testimonialSchema>;