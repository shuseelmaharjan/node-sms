import { z } from "zod";

/**
 * Controlled text inputs should always receive a string.
 *
 * Do not use `.default("")` here because it makes the Zod input
 * type `string | undefined`, while the parsed output remains `string`.
 * That conflicts with React Hook Form's controlled field types.
 */
const optionalText = z.string().trim();

export const identitySchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required"),

  middle_name: optionalText,

  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required"),
});

export type IdentityValues = z.infer<
  typeof identitySchema
>;

export const personalInfoSchema = z.object({
  date_of_birth_in_ad: z
    .string()
    .trim()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Select a valid AD date"
    ),

  date_of_birth_in_bs: z
    .string()
    .trim()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "A valid BS date is required"
    ),

  gender: z
    .string()
    .trim()
    .min(1, "Gender is required"),

  blood_group: z.string().trim(),

  nationality: z
    .string()
    .trim()
    .min(1, "Nationality is required"),

  religion: z.string().trim(),

  mother_tongue: z.string().trim(),

  citizenship_no: z.string().trim(),

  pan_no: z.string().trim(),
});

export type PersonalInfoValues = z.infer<
  typeof personalInfoSchema
>;


export const guardianSchema = z.object({
  relation: z
    .string()
    .trim()
    .min(1, "Relation is required"),

  full_name: z
    .string()
    .trim()
    .min(1, "Full name is required"),

  phone: optionalText,

  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .or(z.literal("")),

  occupation: optionalText,

  is_primary: z.boolean(),
});

export type GuardianValues = z.infer<
  typeof guardianSchema
>;

export const documentSchema = z.object({
  document_type: z
    .string()
    .trim()
    .min(1, "Document type is required"),

  file: z
    .string()
    .trim()
    .min(1, "Document file is required"),

  issued_by: optionalText,
  issued_date: optionalText,
  expiry_date: optionalText,
  remarks: optionalText,
});

export type DocumentValues = z.infer<
  typeof documentSchema
>;

export const healthSchema = z.object({
  is_disabled: z.boolean(),
  disability_details: optionalText,

  visual_issues: z.boolean(),
  hearing_issues: z.boolean(),
  mobility_issues: z.boolean(),

  chronic_illness: z.boolean(),
  chronic_illness_details: optionalText,

  allergies: z.boolean(),
  allergy_details: optionalText,

  medications: z.boolean(),
  medication_details: optionalText,

  dietary_restrictions: z.boolean(),
  dietary_restriction_details: optionalText,

  other_health_issues: z.boolean(),
  other_health_issue_details: optionalText,
});

export type HealthValues = z.infer<
  typeof healthSchema
>;

export const addressFieldsSchema = z.object({
  country: z
    .string()
    .trim()
    .min(1, "Country is required"),

  province: optionalText,
  district: optionalText,
  municipality: optionalText,
  ward_no: optionalText,
  street: optionalText,
  tole: optionalText,
  house_no: optionalText,
  postal_code: optionalText,

  is_primary: z.boolean(),
});

export const addressSchema = z.object({
  address: addressFieldsSchema,
});

export type AddressValues = z.infer<
  typeof addressSchema
>;

export type AddressFieldsValues = z.infer<
  typeof addressFieldsSchema
>;