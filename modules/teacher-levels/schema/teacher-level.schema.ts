import { z } from "zod";

export const teacherLevelSchema = z.object({
  level: z.string().min(1, "Level is required"),
});

export type TeacherLevelValues = z.infer<typeof teacherLevelSchema>;
