import { z } from "zod";
import type { JSONContent } from "@tiptap/react";
import type { BlogEntity, BlogFormEntity } from "../types/blog.types";

const richText: z.ZodType<JSONContent | null> =
  z.object({}).passthrough().nullable();

export const blogSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().min(1, "Author is required"),
  published_at: z.string().min(1, "Publish date is required"),
  content: richText,
});

export type BlogValues = z.infer<typeof blogSchema>;

function empty(): JSONContent {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function parseContent(v?: string | null): JSONContent {
  if (!v) return empty();
  try {
    return JSON.parse(v);
  } catch {
    return empty();
  }
}

export function toPayload(v: BlogValues) {
  return {
    title: v.title.trim(),
    author: v.author.trim(),
    published_at: v.published_at,
    content: JSON.stringify(v.content ?? empty()),
  };
}

export function getDefaultValues(b?: BlogEntity | null): BlogValues {
  return {
    title: b?.title ?? "",
    author: b?.author ?? "",
    published_at: b?.published_at ?? "",
    content: parseContent(b?.content),
  };
}