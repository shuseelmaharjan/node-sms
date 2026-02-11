import { z } from "zod";

export const scheduleSchema = z
  .object({
    kind: z.enum(["class", "break", "holiday"]),
    title: z.string().trim().min(1, "Title is required"),

    batch_id: z.string().min(1, "Batch is required"),

    // always string (sentinel or real id)
    academic_class_id: z.string(),
    section_id: z.string(),

    // always string ("" means none selected)
    subject_id: z.string(),
    teacher_id: z.string(),

    day_of_week: z.number().min(0).max(6),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
  })
  .superRefine((val, ctx) => {
    if (val.end_time && val.start_time && val.end_time <= val.start_time) {
      ctx.addIssue({
        code: "custom",
        message: "End time must be after start time",
        path: ["end_time"],
      });
    }

    if (val.kind === "class") {
      if (!val.academic_class_id || val.academic_class_id === "__batch__") {
        ctx.addIssue({
          code: "custom",
          message: "Class is required for type Class",
          path: ["academic_class_id"],
        });
      }
      if (!val.subject_id) {
        ctx.addIssue({
          code: "custom",
          message: "Subject is required for type Class",
          path: ["subject_id"],
        });
      }
      if (!val.teacher_id) {
        ctx.addIssue({
          code: "custom",
          message: "Teacher is required for type Class",
          path: ["teacher_id"],
        });
      }
    }
  });

export type ScheduleValues = z.infer<typeof scheduleSchema>;
