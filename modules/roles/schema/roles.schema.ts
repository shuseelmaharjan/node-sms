import { z } from "zod";

export const rolesSchema = z.object({
  school_id: z.string().min(1, "School ID is required"),
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  is_system: z.boolean().default(false),
});

export type RoleValues = z.infer<typeof rolesSchema>;
