import { z } from "zod";

export const campusSchema = z.object({
  school: z.string().uuid("School must be a valid UUID"),
  name: z.string().min(2, "Name is required"),
  address: z.string().min(2, "Address is required"),
  phone: z.string().min(5, "Phone is required"),
  is_active: z.boolean(),
});

export type CampusFormValues = z.infer<typeof campusSchema>;
