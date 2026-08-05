import { z } from "zod";

export const bulkInvoiceSchema = z
  .object({
    batch_id: z.string().min(1, "Batch is required."),
    academic_class_id: z.string(),
    section_id: z.string(),
    nepali_month: z.enum([
      "BAISAKH",
      "JESTHA",
      "ASAR",
      "SHRAWAN",
      "BHADRA",
      "ASOJ",
      "KARTIK",
      "MANGSIR",
      "POUSH",
      "MAGH",
      "FALGUN",
      "CHAITRA",
    ]),
    billing_year: z.string().min(1, "Billing year is required."),
    invoice_date: z.string().min(1, "Invoice date is required."),
    due_date: z.string().min(1, "Due date is required."),
    notes: z.string().max(500, "Notes cannot exceed 500 characters."),
  })
  .superRefine((values, ctx) => {
    if (values.due_date < values.invoice_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["due_date"],
        message: "Due date cannot be before invoice date.",
      });
    }

    if (values.section_id && values.section_id !== "__all__" && !values.academic_class_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["section_id"],
        message: "Select a class before selecting a section.",
      });
    }
  });

export type BulkInvoiceValues = z.infer<typeof bulkInvoiceSchema>;
