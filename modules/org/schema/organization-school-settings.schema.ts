import { z } from "zod";

export const organizationSchoolSettingsSchema = z.object({
  school: z.string().uuid("School is required"),
  invoice_prefix: z.string().min(1, "Invoice prefix is required"),
  receipt_prefix: z.string().min(1, "Receipt prefix is required"),
  fiscal_year_label: z.string().min(1, "Fiscal year label is required"),
  late_fee_fixed: z.string().min(1, "Late fee fixed is required"),
  late_fee_percent: z.string().min(1, "Late fee percent is required"),
  is_active: z.boolean().default(true),
});

export type OrganizationSchoolSettingsValues = z.infer<
  typeof organizationSchoolSettingsSchema
>;
