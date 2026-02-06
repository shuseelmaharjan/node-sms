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
  date_of_birth_bs: z.string().optional().default(""),

  gender: z.string().min(1, "Gender is required"),
  blood_group: z.string().min(1, "Blood group is required"),
  nationality: z.string().min(1, "Nationality is required"),
  religion: z.string().min(1, "Religion is required"),
  mother_tongue: z.string().min(1, "Mother tongue is required"),
  citizenship_no: z.string().min(1, "Citizenship no is required"),
  pan_no: z.string().min(1, "PAN no is required"),
});

const addressCommon = {
  id: z.string().optional(),
  province: z.string(),
  district: z.string(),
  municipality: z.string(),
  ward_no: z.string(),
  country: z.string().default("Nepal"),
  street: z.string().optional().default(""),
  tole: z.string(),
  house_no: z.string().optional().default(""),
  postal_code: z.string().optional().default(""),
  is_primary: z.boolean().default(false),
};

const permanentAddressSchema = z.object({
  address_type: z.literal("permanent"),
  ...addressCommon,
}).superRefine((val, ctx) => {
  if (!val.province) ctx.addIssue({ code: "custom", path: ["province"], message: "Province is required" });
  if (!val.district) ctx.addIssue({ code: "custom", path: ["district"], message: "District is required" });
  if (!val.municipality) ctx.addIssue({ code: "custom", path: ["municipality"], message: "Municipality is required" });
  if (!val.ward_no) ctx.addIssue({ code: "custom", path: ["ward_no"], message: "Ward no is required" });
  if (!val.tole) ctx.addIssue({ code: "custom", path: ["tole"], message: "Tole is required" });
});

const temporaryAddressSchema = z.object({
  address_type: z.literal("temporary"),
  ...addressCommon,
}).superRefine((val, ctx) => {
  const started =
    Boolean(val.province || val.district || val.municipality || val.ward_no || val.tole);

  if (started) {
    if (!val.province) ctx.addIssue({ code: "custom", path: ["province"], message: "Province is required" });
    if (!val.district) ctx.addIssue({ code: "custom", path: ["district"], message: "District is required" });
    if (!val.municipality) ctx.addIssue({ code: "custom", path: ["municipality"], message: "Municipality is required" });
    if (!val.ward_no) ctx.addIssue({ code: "custom", path: ["ward_no"], message: "Ward no is required" });
    if (!val.tole) ctx.addIssue({ code: "custom", path: ["tole"], message: "Tole is required" });
  }
});

const addressSchema = z.discriminatedUnion("address_type", [
  permanentAddressSchema,
  temporaryAddressSchema,
]);

// ✅ UPDATED: keep document record IDs for PUT
const documentsSchema = z.object({
  photo_id: z.string().optional(),
  photo_file: z.string().min(1, "Photo is required"),

  citizenship_front_id: z.string().optional(),
  citizenship_front_file: z.string().min(1, "Citizenship (front) is required"),

  citizenship_back_id: z.string().optional(),
  citizenship_back_file: z.string().min(1, "Citizenship (back) is required"),

  pan_id: z.string().optional(),
  pan_file: z.string().min(1, "PAN file is required"),

  signature_id: z.string().optional(),
  signature_file: z.string().min(1, "Signature is required"),
});

export const onboardingAdminSchema = z.object({
  user: userSchema,
  school: schoolSchema,
  profile: profileSchema,
  addresses: z.array(addressSchema).length(2, "Must include permanent and temporary address"),
  documents: documentsSchema,
});

export type OnboardingAdminValues = z.infer<typeof onboardingAdminSchema>;
