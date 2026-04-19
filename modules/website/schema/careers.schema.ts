import { z } from "zod";
import type { JSONContent } from "@tiptap/react";

const richText: z.ZodType<JSONContent | null> =
  z.object({}).passthrough().nullable();

export const careerSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  position: z.string().trim().min(1, "Position is required"),

  job_description: richText,
  requirements: richText,

  expires_at: z.string().min(1, "Expiry date is required"),
});

export type CareerValues = z.infer<typeof careerSchema>;