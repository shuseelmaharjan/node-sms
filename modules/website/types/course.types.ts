import type { JSONContent } from "@tiptap/react";

export type UploadedImageEntity = {
  id: string;
  file_url: string;
  download_url: string;
  file_type: string;
  original_name: string;
  size_bytes: number;
  is_temporary: boolean;
  meta: any;
  uploaded_at: string;
};

export type CourseEntity = {
  id: string;
  serial: number;
  name: string;
  description: string;
  navigation_id: string;
  navigation_name: string;
  slug: string;
  sort_order: number;
  image: UploadedImageEntity | null;
  banner: UploadedImageEntity | null;
  school_id: string;
  tags: string;
  is_popular: boolean;
  created_at: string;
  created_by_id: string;
  updated_at: string;
  updated_by_id: string;
};

/**
 * Form model should be UI-friendly.
 * tags is string[] here, not comma-separated text.
 */
export type CourseFormEntity = {
  name: string;
  description: JSONContent | null;
  navigation_id: string;
  slug: string;
  image_id: string | null;
  banner_id: string | null;
  tags: string[];
  is_popular: boolean;
};