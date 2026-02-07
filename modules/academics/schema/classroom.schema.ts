import { z } from "zod";

export const classroomCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  is_active: z.boolean().default(true),
});

export type ClassroomCreateValues = z.infer<typeof classroomCreateSchema>;

export const classroomUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  is_active: z.boolean().default(true),
});

export type ClassroomUpdateValues = z.infer<typeof classroomUpdateSchema>;
