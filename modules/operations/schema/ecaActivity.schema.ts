import { z } from "zod";

export const ecaActivitySchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  description: z.string().min(1, "Description is required").max(500),
  fees: z.string().uuid("Please select a fee structure"),
});

export type EcaActivityValues = z.infer<typeof ecaActivitySchema>;
