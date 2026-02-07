// modules/fees/schema/feeHead.schema.ts
import { z } from "zod";

export const feeHeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  group: z.string().min(1, "Group is required"),
  description: z.string().optional().default(""),
  is_active: z.boolean().default(true),
});

export type FeeHeadValues = z.infer<typeof feeHeadSchema>;
