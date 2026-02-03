import { z } from "zod";

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Old password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  })
  .refine((data) => data.old_password !== data.new_password, {
    path: ["new_password"],
    message: "New password must be different from old password",
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const changePasswordDefaults: ChangePasswordValues = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};
