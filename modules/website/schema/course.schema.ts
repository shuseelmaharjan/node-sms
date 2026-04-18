import { z } from "zod";
import type { JSONContent } from "@tiptap/react";
import type { CourseEntity, CourseFormEntity } from "../types/course.types";

const richTextJsonSchema: z.ZodType<JSONContent | null> = z
  .object({})
  .passthrough()
  .nullable();

export const courseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(150, "Name must be at most 150 characters"),

  description: richTextJsonSchema,

  navigation_id: z.string().uuid("Navigation is required"),

  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(150, "Slug must be at most 150 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers and hyphens"
    ),

  image_id: z.string().uuid().nullable().optional(),
  banner_id: z.string().uuid().nullable().optional(),

  /**
   * UI stores tags as array.
   * API payload will convert this into comma-separated string.
   */
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Tag cannot be empty")
        .max(50, "Each tag must be at most 50 characters")
    )
    .max(20, "You can add up to 20 tags")
    .default([]),

  is_popular: z.boolean().default(false),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export const courseCreateSchema = courseFormSchema;
export const courseUpdateSchema = courseFormSchema;

export function slugifyCourseName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createEmptyRichText(): JSONContent {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
}

export function parseCourseDescription(value?: string | null): JSONContent {
  if (!value) return createEmptyRichText();

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed as JSONContent;
    }
    return createEmptyRichText();
  } catch {
    return createEmptyRichText();
  }
}

export function parseCourseTags(value?: string | null): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, arr) => arr.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === index);
}

export function stringifyCourseTags(tags: string[]): string {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, arr) => arr.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === index)
    .join(", ");
}

export function normalizeCourseValues(values: CourseFormValues): CourseFormEntity {
  return {
    name: values.name.trim(),
    description: values.description ?? createEmptyRichText(),
    navigation_id: values.navigation_id,
    slug: values.slug.trim().toLowerCase(),
    image_id: values.image_id ?? null,
    banner_id: values.banner_id ?? null,
    tags: values.tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .filter((tag, index, arr) => arr.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === index),
    is_popular: values.is_popular,
  };
}

/**
 * Convert UI form values into API payload format.
 */
export function toCourseApiPayload(values: CourseFormValues) {
  const normalized = normalizeCourseValues(values);

  return {
    ...normalized,
    description: JSON.stringify(
      normalized.description ?? createEmptyRichText()
    ),
    tags: stringifyCourseTags(normalized.tags),
  };
}

export function getCourseDefaultValues(course?: CourseEntity | null): CourseFormValues {
  if (!course) {
    return {
      name: "",
      description: createEmptyRichText(),
      navigation_id: "",
      slug: "",
      image_id: null,
      banner_id: null,
      tags: [],
      is_popular: false,
    };
  }

  return {
    name: course.name ?? "",
    description: parseCourseDescription(course.description),
    navigation_id: course.navigation_id ?? "",
    slug: course.slug ?? "",
    image_id: course.image?.id ?? null,
    banner_id: course.banner?.id ?? null,
    tags: parseCourseTags(course.tags),
    is_popular: course.is_popular ?? false,
  };
}