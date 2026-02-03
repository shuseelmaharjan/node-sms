import { api } from "@/api";
import type {
  ForgotPasswordValues,
  VerifyOtpValues,
  ResetPasswordValues,
} from "../schema/reset-password.schema";

// Step 1: Send OTP Response
export type ForgotPasswordResponse = {
  sent: boolean;
  message: string;
};

// Step 2: Verify OTP Response
export type VerifyOtpResponse = {
  reset_token: string;
  reset_token_expires_at: string;
};

// Step 3: Reset Password Response
export type ResetPasswordResponse = {
  reset: boolean;
  message: string;
};

export const resetPasswordApi = {
  // Step 1: Send OTP to email
  sendOtp: async (payload: ForgotPasswordValues) => {
    const res = await api.post<ForgotPasswordResponse>(
      "/api/v1/accounts/auth/password/forgot/",
      payload
    );
    return res.data;
  },

  // Step 2: Verify OTP and get reset token
  verifyOtp: async (payload: VerifyOtpValues) => {
    const res = await api.post<VerifyOtpResponse>(
      "/api/v1/accounts/auth/password/verify-otp/",
      payload
    );
    return res.data;
  },

  // Step 3: Reset password with token
  resetPassword: async (payload: ResetPasswordValues) => {
    const res = await api.post<ResetPasswordResponse>(
      "/api/v1/accounts/auth/password/reset/",
      {
        email: payload.email,
        reset_token: payload.reset_token,
        new_password: payload.new_password,
      }
    );
    return res.data;
  },
};