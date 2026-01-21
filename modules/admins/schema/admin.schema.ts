import { z } from "zod";

export const personalInfoSchema = z.object({
  phone: z.string().min(7, "Phone is required"),
  email: z.string().email("Invalid email"),
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().default(""),
  last_name: z.string().min(1, "Last name is required"),
});
export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

export const schoolInfoSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "School name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email"),

  logo_file: z.string().uuid("Invalid file id").nullable().default(null),
  pan_number: z.string().min(1, "PAN number is required"),
  registration_number: z.string().min(1, "Registration number is required"),
  pan_document_file: z.string().uuid("Invalid file id").nullable().default(null),
  registration_document_file: z.string().uuid("Invalid file id").nullable().default(null),

  is_active: z.boolean().default(true),
});
export type SchoolInfoValues = z.infer<typeof schoolInfoSchema>;

export const addressSchema = z.object({
  address_type: z.enum(["permanent", "temporary"]),
  country: z.string().min(1),
  province: z.string().min(1),
  district: z.string().min(1),
  municipality: z.string().min(1),
  ward_no: z.string().min(1),
  street: z.string().default(""),
  tole: z.string().default(""),
  house_no: z.string().default(""),
  postal_code: z.string().default(""),
  is_primary: z.boolean().default(false),
});

export const documentSchema = z.object({
  document_type: z.enum(["photo", "citizenship_front", "citizenship_back", "pan", "signature"]),
  file: z.string().uuid("Invalid file id").nullable().default(null),
  issued_by: z.string().default(""),
  issued_date: z.string().nullable().default(null),
  expiry_date: z.string().nullable().default(null),
  remarks: z.string().default(""),
});

export const clientInfoSchema = z.object({
  date_of_birth: z.string().min(1, "DOB is required"),
  date_of_birth_type: z.literal("bs"),
  gender: z.string().min(1),
  blood_group: z.string().min(1),
  nationality: z.string().min(1),
  religion: z.string().min(1),
  mother_tongue: z.string().min(1),
  citizenship_no: z.string().min(1),
  pan_no: z.string().min(1),
  addresses: z.array(addressSchema).min(1),
  documents: z.array(documentSchema).min(1),
});
export type ClientInfoValues = z.infer<typeof clientInfoSchema>;
