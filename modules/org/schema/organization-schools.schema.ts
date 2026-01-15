import { z } from "zod";

export const organizationSchoolsSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").min(1, "Email is required"),

  // backend expects logo_file_id, not logo_file
  logo_file_id: z.string().uuid().min(1, "Logo file is required").nullable().default(null),

  is_active: z.boolean().default(true),
});

export type OrganizationSchoolValues = z.infer<typeof organizationSchoolsSchema>;
