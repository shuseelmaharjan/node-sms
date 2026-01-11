import { z } from "zod";

export const schoolSchema = z.object({
  code: z.string().min(2, "School code is required"),
  name: z.string().min(2, "School name is required"),
  address: z.string().min(2, "Address is required"),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email("Valid email is required"),
  logo_file: z.string().uuid("Logo file must be a valid UUID").nullable().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().min(1, "Currency is required"),
  is_active: z.boolean().default(true),
});

export type SchoolFormValues = z.infer<typeof schoolSchema>;
