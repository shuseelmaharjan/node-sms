import { z } from "zod";

export const schoolSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(5, "Name must be at least 5 characters long"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  phone: z.string()
    .min(1, "Phone is required")
    .regex(/^[+]?[0-9\s\-\(\)]+$/, "Phone number can only contain numbers, spaces, hyphens, parentheses, and + symbol"),
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  is_active: z.boolean().default(true),

  // Form keeps UUID here - now required
  logo_file_id: z.string().uuid("Invalid file id").min(1, "Logo is required"),
});

export type SchoolFormValues = z.infer<typeof schoolSchema>;

export type LogoFile = {
  id: string;
  file_url: string;
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
  logo_file_id: "", // Empty string for required field
};
