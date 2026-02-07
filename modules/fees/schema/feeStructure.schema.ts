import { z } from "zod";

export const feeStructureSchema = z
  .object({
    fee_head: z.string().uuid("Fee head is required"),

    amount: z
      .string()
      .min(1, "Amount is required")
      .refine(
        (v) => !Number.isNaN(Number(v)) && Number(v) >= 0,
        "Amount must be a number >= 0"
      ),

    period: z.enum(["MONTHLY", "QUARTERLY", "SEMESTER", "ANNUAL", "OTHER", "ONE_TIME"]),

    status: z.enum(["active", "inactive", "archived", "deleted", "expired"]),

    upgrade_impact: z.boolean().default(false),

    scope: z.enum(["GLOBAL", "CLASS", "BATCH_CLASS"]),

    tax_included: z.boolean().default(false),

    batch: z.union([z.string().min(1), z.null()]).optional().default(null),


    academic_class: z.union([z.string().uuid(), z.null()]).optional().default(null),
  })
  .superRefine((val, ctx) => {
    const scope = val.scope;

    if (scope === "GLOBAL") {
      if (val.batch != null) {
        ctx.addIssue({
          code: "custom",
          path: ["batch"],
          message: "Batch must be empty for GLOBAL.",
        });
      }
      if (val.academic_class != null) {
        ctx.addIssue({
          code: "custom",
          path: ["academic_class"],
          message: "Class must be empty for GLOBAL.",
        });
      }
    }

    if (scope === "CLASS" || scope === "BATCH_CLASS") {
      if (val.batch == null) {
        ctx.addIssue({
          code: "custom",
          path: ["batch"],
          message: "Batch is required for this scope.",
        });
      }
      if (val.academic_class == null || val.academic_class === "") {
        ctx.addIssue({
          code: "custom",
          path: ["academic_class"],
          message: "Class is required for this scope.",
        });
      }
    }
  });

export type FeeStructureValues = z.infer<typeof feeStructureSchema>;
