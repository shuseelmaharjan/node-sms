// lib/auth/api.ts
import axios from "axios";
import { toast } from "sonner";
import type { User } from "./store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type LoginResponse = { accessToken: string; user: User; message?: string };
export type MeResponse = {
  user: User;
  session: { active: boolean; serverTime: string };
  accessToken?: string;
  message?: string;
};

export type ApiError = {
  status?: number;
  message: string;
  data?: unknown;
};

function extractDjangoErrorMessage(err: unknown): ApiError {
  if (!axios.isAxiosError(err)) {
    return { message: "Something went wrong", data: err };
  }

  const status = err.response?.status;
  const data: any = err.response?.data;

  // Common DRF patterns
  if (!data) {
    return { status, message: err.message || "Request failed" };
  }

  if (typeof data === "string") {
    return { status, message: data, data };
  }

  if (data.non_field_errors?.length) {
    return { status, message: String(data.non_field_errors[0]), data };
  }

  if (data.detail) {
    return { status, message: String(data.detail), data };
  }

  if (data.message) {
    return { status, message: String(data.message), data };
  }

  // Field errors: { field: ["msg"] }
  for (const [field, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length) {
      return { status, message: `${field}: ${String(value[0])}`, data };
    }
  }

  return { status, message: err.message || "Request failed", data };
}

// Dedicated client for auth endpoints with automatic toast handling
export const authClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ required for HttpOnly refresh cookie
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "web",
  },
});

// Add response interceptors for automatic toast notifications
authClient.interceptors.response.use(
  (response) => {
    // Show success toast if response contains a message
    if (response.data?.message) {
      toast.success(response.data.message);
    }
    return response;
  },
  (error) => {
    // Extract error message and show toast
    const apiErr = extractDjangoErrorMessage(error);
    
    // Show appropriate toast based on status
    const status = apiErr.status;
    if (status === 401) {
      toast.error(apiErr.message, {
        description: "Please check your credentials and try again.",
      });
    } else if (status && status >= 500) {
      toast.error("Server Error", {
        description: apiErr.message,
      });
    } else {
      toast.error(apiErr.message);
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  /**
   * Login contract (recommended):
   * POST /api/auth/login/  body: { identifier, password }
   * Returns: { accessToken, user } and sets HttpOnly refresh cookie
   * Toast notifications are handled automatically by interceptors
   */
  login: async (identifier: string, password: string): Promise<LoginResponse> => {
    const res = await authClient.post<LoginResponse>("/api/auth/login/", {
      identifier,
      password,
    });
    return res.data;
  },

  me: async (): Promise<MeResponse> => {
    const res = await authClient.get<MeResponse>("/api/auth/me/");
    return res.data;
  },

  refresh: async (): Promise<{ accessToken: string }> => {
    const res = await authClient.post<{ accessToken: string }>(
      "/api/auth/refresh/",
      null
    );
    return res.data;
  },

  logout: async (): Promise<unknown> => {
    const res = await authClient.post("/api/auth/logout/", null);
    return res.data;
  },
};
