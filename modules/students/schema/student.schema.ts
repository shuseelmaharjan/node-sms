// modules/students/schema/student.schema.ts
import { z } from "zod";

const phoneRegex = /^[0-9+]{7,20}$/;

const optionalPhoneSchema = z
  .string()
  .optional()
  .default("")
  .refine((v) => !v || phoneRegex.test(v), { message: "Invalid phone" });

const optionalEmailSchema = z
  .string()
  .optional()
  .default("")
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: "Invalid email",
  });

const userSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional().default(""),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required").regex(phoneRegex, "Invalid phone"),
  email: optionalEmailSchema,
});

const profileSchema = z.object({
  date_of_birth_bs: z.string().min(1, "DOB (BS) is required"),
  gender: z.string().min(1, "Gender is required"),
  blood_group: z.string().min(1, "Blood group is required"),
  nationality: z.string().min(1, "Nationality is required"),
  religion: z.string().min(1, "Religion is required"),
  mother_tongue: z.string().min(1, "Mother tongue is required"),
  citizenship_no: z.string().optional().default(""),
  pan_no: z.string().optional().default(""),
});

const guardiansSchema = z
  .object({
    father_name: z.string().optional().default(""),
    father_phone: optionalPhoneSchema,
    father_email: optionalEmailSchema,

    mother_name: z.string().optional().default(""),
    mother_phone: optionalPhoneSchema,
    mother_email: optionalEmailSchema,

    guardian_name: z.string().optional().default(""),
    guardian_phone: optionalPhoneSchema,
    guardian_email: optionalEmailSchema,
  })
  .superRefine((val, ctx) => {
    const anyFilled = Boolean(
      (val.father_name || "").trim() ||
        (val.mother_name || "").trim() ||
        (val.guardian_name || "").trim()
    );
    if (!anyFilled) {
      ctx.addIssue({
        code: "custom",
        path: ["father_name"],
        message: "At least one guardian name is required (Father/Mother/Guardian).",
      });
    }
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

const permanentAddressSchema = z
  .object({
    address_type: z.literal("permanent"),
    ...addressCommon,
  })
  .superRefine((val, ctx) => {
    if (!val.province) ctx.addIssue({ code: "custom", path: ["province"], message: "Province is required" });
    if (!val.district) ctx.addIssue({ code: "custom", path: ["district"], message: "District is required" });
    if (!val.municipality) ctx.addIssue({ code: "custom", path: ["municipality"], message: "Municipality is required" });
    if (!val.ward_no) ctx.addIssue({ code: "custom", path: ["ward_no"], message: "Ward no is required" });
    if (!val.tole) ctx.addIssue({ code: "custom", path: ["tole"], message: "Tole is required" });
  });

const temporaryAddressSchema = z
  .object({
    address_type: z.literal("temporary"),
    ...addressCommon,
  })
  .superRefine((val, ctx) => {
    const started = Boolean(val.province || val.district || val.municipality || val.ward_no || val.tole);
    if (started) {
      if (!val.province) ctx.addIssue({ code: "custom", path: ["province"], message: "Province is required" });
      if (!val.district) ctx.addIssue({ code: "custom", path: ["district"], message: "District is required" });
      if (!val.municipality) ctx.addIssue({ code: "custom", path: ["municipality"], message: "Municipality is required" });
      if (!val.ward_no) ctx.addIssue({ code: "custom", path: ["ward_no"], message: "Ward no is required" });
      if (!val.tole) ctx.addIssue({ code: "custom", path: ["tole"], message: "Tole is required" });
    }
  });

const addressSchema = z.discriminatedUnion("address_type", [permanentAddressSchema, temporaryAddressSchema]);

const documentsSchema = z.object({
  photo_id: z.string().optional(),
  photo_file: z.string().min(1, "Photo is required"),

  birth_certificate_id: z.string().optional(),
  birth_certificate_file: z.string().min(1, "Birth certificate is required"),

  transfer_certificate_id: z.string().optional(),
  transfer_certificate_file: z.string().optional().default(""),

  marksheet_id: z.string().optional(),
  marksheet_file: z.string().optional().default(""),
});

const otherInfoSchema = z.object({
  is_disabled: z.boolean(),
  disability_details: z.string().optional().default(""),

  visual_issues: z.boolean(),
  hearing_issues: z.boolean(),
  mobility_issues: z.boolean(),

  chronic_illness: z.boolean(),
  chronic_illness_details: z.string().optional().default(""),

  allergies: z.boolean(),
  allergy_details: z.string().optional().default(""),

  medications: z.boolean(),
  medication_details: z.string().optional().default(""),

  dietary_restrictions: z.boolean(),
  dietary_restriction_details: z.string().optional().default(""),

  other_health_issues: z.boolean(),
  other_health_issue_details: z.string().optional().default(""),
});

export const studentSchema = z.object({
  user: userSchema,
  profile: profileSchema,
  guardians: guardiansSchema,
  addresses: z.array(addressSchema).length(2, "Must include permanent and temporary address"),
  documents: documentsSchema,
  other_info: otherInfoSchema,
});

export type StudentValues = z.infer<typeof studentSchema>;
