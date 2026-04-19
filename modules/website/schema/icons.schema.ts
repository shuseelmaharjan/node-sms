import { z } from "zod";

export const iconSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be at most 120 characters"),

  image_id: z.string().uuid("Image is required"),
});

export type IconValues = z.infer<typeof iconSchema>;