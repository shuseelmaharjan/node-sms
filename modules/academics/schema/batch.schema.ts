// modules/academics/schema/batch.schema.ts
import { z } from "zod";

export const batchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  start_date_bs: z.string().min(1, "Start date (BS) is required"),
  start_date_ad: z.string().optional().default(""),
  end_date_bs: z.string().min(1, "End date (BS) is required"),
  end_date_ad: z.string().optional().default(""),
  is_active: z.boolean().default(false),
});

export type BatchValues = z.infer<typeof batchSchema>;
