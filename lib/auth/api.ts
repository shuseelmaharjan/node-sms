// lib/auth/api.ts
import { api } from "@/api/client";
import { toast } from "sonner";
import type { User } from "./store";

// Extract Django error messages for auth routes
function extractDjangoError(error: any): string {
  const data = error.response?.data;

  if (!data) {
    return error.message || "Request failed";
  }

  // Handle Django REST framework error patterns
  if (data.non_field_errors?.length) {
    return data.non_field_errors[0];
  }

  if (data.detail) {
    return data.detail;
  }

  if (data.message) {
    return data.message;
  }

  // Handle field-specific errors
  for (const [field, errors] of Object.entries(data)) {
    if (Array.isArray(errors) && errors.length > 0) {
      return `${field}: ${errors[0]}`;
    }
  }

  return error.message || "Request failed";
}

export type LoginResponse = { accessToken: string; user: User; message?: string };
export type MeResponse = {
  user: User;
  session: { active: boolean; serverTime: string };
  accessToken?: string;
  message?: string;
};

export const authApi = {
  /**
   * Login with identifier and password
   * Handles its own error display since interceptor skips auth routes
   */
  login: async (identifier: string, password: string): Promise<LoginResponse> => {
    try {
      console.log('Auth API: Attempting login...');
      const res = await api.post<LoginResponse>("/api/auth/login/", {
        identifier,
        password,
      });

      console.log('Auth API: Login successful', res.data);

      // Show success message if provided
      if (res.data.message) {
        toast.success(res.data.message);
      }

      return res.data;
    } catch (error: any) {
      console.log('Auth API: Login error caught:', error);
      console.log('Auth API: Error response:', error.response?.data);

      // Extract and display proper error message
      const errorMessage = extractDjangoError(error);
      const status = error.response?.status;

      console.log('Auth API: Extracted error message:', errorMessage);

      if (status && status >= 500) {
        console.log('Auth API: Showing server error toast');
        toast.error("Server Error", { description: errorMessage });
      } else {
        console.log('Auth API: Showing client error toast:', errorMessage);
        toast.error(errorMessage);
      }

      // Don't re-throw the error since we've handled it with toast
      // Instead, throw a clean error that won't cause duplicate logging
      throw new Error('LOGIN_FAILED');
    }
  },


    me: async (): Promise<MeResponse> => {
    try {
      const res = await api.get<MeResponse>("/api/auth/me/");
      return res.data;
    } catch (error: any) {
      const msg = String(error?.message || "");
      if (msg.includes("Unexpected token <") || msg.includes("Unexpected token '<'") || error?.name === "SyntaxError") {
        console.error("authApi.me(): got HTML instead of JSON. Check proxy/rewrite/back-end URL.");
        throw new Error("AUTH_HTML_RESPONSE");
      }
      throw error;
    }
  },

  refresh: async (): Promise<{ accessToken: string }> => {
    try {
      const res = await api.post<{ accessToken: string }>("/api/auth/refresh/", null);
      return res.data;
    } catch (error: any) {
      const msg = String(error?.message || "");
      if (msg.includes("Unexpected token <") || msg.includes("Unexpected token '<'") || error?.name === "SyntaxError") {
        console.error("authApi.refresh(): got HTML instead of JSON. Check proxy/rewrite/back-end URL.");
        throw new Error("AUTH_HTML_RESPONSE");
      }
      throw error;
    }
  },



  logout: async (): Promise<unknown> => {
    try {
      console.log('Auth API: Attempting logout...');
      const res = await api.post("/api/auth/logout/", null);

      console.log('Auth API: Logout successful');

      // Don't show success toast here - let session.ts handle it
      // This avoids duplicate toasts

      return res.data;
    } catch (error: any) {
      console.log('Auth API: Logout error caught:', error);

      const errorMessage = extractDjangoError(error);
      const status = error.response?.status;

      // Show error toast for server errors
      if (status && status >= 500) {
        toast.error("Server Error", { description: errorMessage });
      } else if (status && status >= 400) {
        toast.error("Logout failed", { description: errorMessage });
      }

      // Throw clean error to prevent duplicate error handling
      throw new Error('LOGOUT_FAILED');
    }
  },
};