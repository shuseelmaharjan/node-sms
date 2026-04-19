import { z } from "zod";

export const galleryGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(150, "Group name must be at most 150 characters"),
});

export const galleryImageSchema = z.object({
  image_id: z.string().uuid("Image is required"),
  caption: z.string().optional().default(""),
  gallery_group_id: z.string().uuid("Group is required"),
});

export const galleryUploadItemSchema = z.object({
  image_id: z.string().uuid("Image is required"),
  caption: z.string().optional().default(""),
});

export const galleryUploadSchema = z.object({
  gallery_group_id: z.string().uuid("Group is required"),
  images: z
    .array(galleryUploadItemSchema)
    .min(1, "Please select at least one image"),
});

export type GalleryGroupValues = z.infer<typeof galleryGroupSchema>;
export type GalleryImageValues = z.infer<typeof galleryImageSchema>;
export type GalleryUploadItemValues = z.infer<typeof galleryUploadItemSchema>;
export type GalleryUploadValues = z.infer<typeof galleryUploadSchema>;