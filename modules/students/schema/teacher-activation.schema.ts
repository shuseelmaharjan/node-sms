import { z } from "zod";

export const teacherActivationSchema = z.object({
  teacher_level: z.string().min(1, "Teacher level is required"),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
});

export type TeacherActivationValues = z.infer<typeof teacherActivationSchema>;
