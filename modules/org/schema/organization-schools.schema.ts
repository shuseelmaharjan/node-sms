import { z } from "zod";

export const organizationSchoolsSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email("Invalid email").optional().or(z.literal("")).default(""),

  // backend expects logo_file_id, not logo_file
  logo_file_id: z.string().uuid().nullable().optional(),

  is_active: z.boolean().default(true),
});

export type OrganizationSchoolValues = z.infer<typeof organizationSchoolsSchema>;
