import { z } from "zod";

export const subjectCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional().default(""),
});

export const subjectUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional().default(""),
});

export type SubjectCreateValues = z.infer<typeof subjectCreateSchema>;
export type SubjectUpdateValues = z.infer<typeof subjectUpdateSchema>;
