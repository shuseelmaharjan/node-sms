import { z } from "zod";

// Step 1: Forgot Password (Send OTP)
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const forgotPasswordDefaults: ForgotPasswordValues = {
  email: "",
};

// Step 2: Verify OTP
export const verifyOtpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

export type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;

export const verifyOtpDefaults: VerifyOtpValues = {
  email: "",
  otp: "",
};

// Step 3: Reset Password
export const resetPasswordSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    reset_token: z.string().min(1, "Reset token is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const resetPasswordDefaults: ResetPasswordValues = {
  email: "",
  reset_token: "",
  new_password: "",
  confirm_password: "",
};

// Combined state for the entire flow
export type ResetPasswordState = {
  step: 1 | 2 | 3;
  email: string;
  resetToken?: string;
  resetTokenExpiresAt?: string;
};

export const initialResetState: ResetPasswordState = {
  step: 1,
  email: "",
};