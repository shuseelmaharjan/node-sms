import { z } from "zod";

export const footerGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required"),
});

export const footerLinkSchema = z.object({
  name: z.string().trim().min(1, "Link name is required"),
  url: z.string().trim().url("Invalid URL"),
  footer_group_id: z.string().uuid("Group is required"),
});

export type FooterGroupValues = z.infer<typeof footerGroupSchema>;
export type FooterLinkValues = z.infer<typeof footerLinkSchema>;