import { z } from "zod";

export const sectionCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(30),
  is_active: z.boolean().default(true),
});

export type SectionCreateValues = z.infer<typeof sectionCreateSchema>;

export const sectionUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(30),
  is_active: z.boolean().default(true),
});

export type SectionUpdateValues = z.infer<typeof sectionUpdateSchema>;
