import { z } from "zod";
import type { JSONContent } from "@tiptap/react";

const richTextSchema: z.ZodType<JSONContent | null> =
  z.object({}).passthrough().nullable();

export const eventSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),

  description: richTextSchema,

  event_date: z.string().min(1, "Event date is required"),
});

export type EventValues = z.infer<typeof eventSchema>;