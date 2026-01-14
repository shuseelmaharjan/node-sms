import { z } from "zod";

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from old password",
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const changePasswordDefaults: ChangePasswordValues = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};
