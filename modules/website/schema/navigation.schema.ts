import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be at most 100 characters");

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(100, "Slug must be at most 100 characters")
  .regex(
    /^[a-z0-9-]+$/,
    "Slug can only contain lowercase letters, numbers and hyphens"
  );

export const navigationFormSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
});

export const navigationCreateSchema = navigationFormSchema;
export const navigationUpdateSchema = navigationFormSchema;

export type NavigationFormValues = z.infer<typeof navigationFormSchema>;
export type NavigationCreateValues = NavigationFormValues;
export type NavigationUpdateValues = NavigationFormValues;

export function normalizeNavigationValues(
  values: NavigationFormValues
): NavigationFormValues {
  return {
    name: values.name.trim(),
    slug: values.slug.trim().toLowerCase(),
  };
}

export function slugifyNavigationName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}