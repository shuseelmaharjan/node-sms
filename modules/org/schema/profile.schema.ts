import { z } from "zod";

const requiredName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(150, `${label} must be 150 characters or fewer`);

export const basicInfoSchema = z.object({
  first_name: requiredName("First name"),
  middle_name: z
    .string()
    .trim()
    .max(150, "Middle name must be 150 characters or fewer"),
  last_name: requiredName("Last name"),
  phone: z
    .string()
    .trim()
    .regex(/^9\d{9}$/, "Enter a valid 10-digit Nepal mobile number"),
});

export type BasicInfoValues = z.infer<typeof basicInfoSchema>;

export const emailChangeRequestSchema = z.object({
  new_email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
});

export type EmailChangeRequestValues = z.infer<
  typeof emailChangeRequestSchema
>;

export const emailChangeVerifySchema = z.object({
  otp: z
    .string()
    .length(6, "Enter the complete 6-digit verification code")
    .regex(/^\d{6}$/, "Verification code must contain only numbers"),
});

export type EmailChangeVerifyValues = z.infer<
  typeof emailChangeVerifySchema
>;

export const emailChangeRequestDefaults: EmailChangeRequestValues = {
  new_email: "",
};

export const emailChangeVerifyDefaults: EmailChangeVerifyValues = {
  otp: "",
};

/** Converts +97798XXXXXXXX or 97798XXXXXXXX to 98XXXXXXXX for the form. */
export function phoneToFormValue(phone: string | null | undefined): string {
  const digits = String(phone ?? "").replace(/\D/g, "");

  if (digits.startsWith("977") && digits.length > 10) {
    return digits.slice(3);
  }

  return digits.startsWith("0") ? digits.slice(1) : digits;
}
