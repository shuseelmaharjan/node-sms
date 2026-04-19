import { z } from "zod";

const optionalUrlSchema = z
  .string()
  .optional()
  .default("")
  .refine((v) => {
    if (!v) return true;
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  }, "Invalid URL");

export const homepageBannerSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters"),

    subtitle: z.string().optional().default(""),
    description: z.string().optional().default(""),

    image_id: z.string().uuid("Image is required"),

    have_link: z.boolean().default(false),

    link_url: optionalUrlSchema,
    button_link: z.string().optional().default(""),
  })
  .superRefine((val, ctx) => {
    if (val.have_link) {
      if (!val.link_url?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["link_url"],
          message: "Link URL is required when link is enabled",
        });
      }

      if (!val.button_link?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["button_link"],
          message: "Button label is required when link is enabled",
        });
      }
    }
  });

export type HomepageBannerValues = z.infer<typeof homepageBannerSchema>;