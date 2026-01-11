import { z } from "zod";

/**
 * Backend response includes logo_file object, but payload may accept:
 * - logo_file: UUID (string)
 *
 * We'll send `logo_file` as UUID string or null.
 */
export const schoolSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email("Invalid email").optional().or(z.literal("")).default(""),
  is_active: z.boolean().default(true),

  // file UUID from ImagePickerField
  logo_file: z.string().uuid("Invalid file id").nullable().optional(),
});

export type SchoolFormValues = z.infer<typeof schoolSchema>;

export type LogoFile = {
  id: string;
  file: string;
  file_type: string;
  original_name: string;
  size_bytes: number;
  is_temporary: boolean;
  meta: any;
  uploaded_at: string;
};

export type School = {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_file: LogoFile | null;
  is_active: boolean;
  created_at: string;
};

export const schoolCreateDefaults: SchoolFormValues = {
  code: "",
  name: "",
  address: "",
  phone: "",
  email: "",
  is_active: true,
  logo_file: null,
};
