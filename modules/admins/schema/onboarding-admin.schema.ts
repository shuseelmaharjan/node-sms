// modules/admin/schema/onboarding-admin.schema.ts
import { z } from "zod";

const phoneRegex = /^[0-9+]{7,20}$/;

const userSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional().default(""),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required").regex(phoneRegex, "Invalid phone"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
});

const schoolSchema = z.object({
  code: z.string().min(1, "School code is required"),
  name: z.string().min(1, "School name is required"),
  address: z.string().min(1, "School address is required"),
  phone: z.string().min(1, "School phone is required").regex(phoneRegex, "Invalid phone"),
  email: z.string().min(1, "School email is required").email("Invalid email"),

  logo_file: z.string().min(1, "Logo is required"),
  pan_number: z.string().min(1, "PAN number is required"),
  registration_number: z.string().min(1, "Registration number is required"),
  pan_document_file: z.string().min(1, "PAN document is required"),
  registration_document_file: z.string().min(1, "Registration document is required"),
});

const profileSchema = z.object({
  date_of_birth_ad: z.string().min(1, "DOB (AD) is required"),
  // UI-only (optional): if you want to store BS in form state
  date_of_birth_bs: z.string().optional().default(""),

  gender: z.string().min(1, "Gender is required"),
  blood_group: z.string().min(1, "Blood group is required"),
  nationality: z.string().min(1, "Nationality is required"),
  religion: z.string().min(1, "Religion is required"),
  mother_tongue: z.string().min(1, "Mother tongue is required"),
  citizenship_no: z.string().min(1, "Citizenship no is required"),
  pan_no: z.string().min(1, "PAN no is required"),
});

const addressSchema = z.object({
  id: z.string().optional(),
  address_type: z.enum(["permanent", "temporary"]),
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  municipality: z.string().min(1, "Municipality is required"),
  ward_no: z.string().min(1, "Ward no is required"),
  country: z.string().min(1, "Country is required").default("Nepal"),
  street: z.string().optional().default(""),
  tole: z.string().min(1, "Tole is required"),
  house_no: z.string().optional().default(""),
  postal_code: z.string().optional().default(""),
  is_primary: z.boolean().default(false),
});

const documentsSchema = z.object({
  photo_file: z.string().min(1, "Photo is required"),

  citizenship_front_file: z.string().min(1, "Citizenship (front) is required"),
  citizenship_back_file: z.string().min(1, "Citizenship (back) is required"),

  pan_file: z.string().min(1, "PAN file is required"),

  signature_file: z.string().min(1, "Signature is required"),
});

export const onboardingAdminSchema = z.object({
  user: userSchema,
  school: schoolSchema,
  profile: profileSchema,
  addresses: z
    .array(addressSchema)
    .length(2, "Must include permanent and temporary address"),
  documents: documentsSchema,
});

export type OnboardingAdminValues = z.infer<typeof onboardingAdminSchema>;
