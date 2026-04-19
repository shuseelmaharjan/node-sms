import { z } from "zod";

const optionalUrlSchema = z
  .string()
  .optional()
  .default("")
  .refine((v) => {
    if (!v) return true;
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  }, "Invalid URL");

export const adSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),

  description: z.string().optional().default(""),

  image_id: z.string().uuid("Image is required"),

  link_url: optionalUrlSchema,
});

export type AdValues = z.infer<typeof adSchema>;