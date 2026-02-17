import { z } from "zod";

const moneyString = z
  .string()
  .default("0.00")
  .refine((v) => /^(\d+)(\.\d{0,2})?$/.test((v ?? "").trim()), "Enter a valid number")
  .transform((v) => ((v ?? "").trim() === "" ? "0.00" : (v ?? "").trim()));

export const confirmEnrollmentSchema = z.object({
  batch: z.string().min(1, "Batch is required"),
  academic_class: z.string().min(1, "Class is required"),
  section: z.string().optional(),

  fee_structures: z.array(z.string()).min(1, "Select at least one fee item"),

  total_payable_amount: moneyString,
  discounted_amount: moneyString,
  scholarship_amount: moneyString,
});

export type ConfirmEnrollmentValues = z.infer<typeof confirmEnrollmentSchema>;
