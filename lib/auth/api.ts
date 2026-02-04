// lib/auth/api.ts
import { api } from "@/api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/api/errors";
import type { User } from "./store";

export type LoginResponse = {
  accessToken: string;
  user: User;
  session: { active: boolean; serverTime: string };
  message?: string;
};

export type MeResponse = {
  user: User;
  session: { active: boolean; serverTime: string };
  accessToken?: string;
  message?: string;
};

export const authApi = {
  /**
   * Login
   * - Handles Django `non_field_errors`
   * - Shows toast on error
   * - Does NOT rely on axios interceptor
   */
  login: async (identifier: string, password: string): Promise<LoginResponse> => {
    try {
      const res = await api.post<LoginResponse>("/api/auth/login/", {
        identifier,
        password,
      });

      if (res.data?.message) {
        toast.success(res.data.message);
      }

      return res.data;
    } catch (err) {
      const message = getApiErrorMessage(err);

      // This covers:
      // { "non_field_errors": ["Invalid credentials."] }
      toast.error(message);

      // throw controlled error to stop flow
      throw new Error("LOGIN_FAILED");
    }
  },

  /**
   * Fetch current user/session
   * - No toast (called during bootstrap)
   */
  me: async (): Promise<MeResponse> => {
    try {
      const res = await api.get<MeResponse>("/api/auth/me/");
      return res.data;
    } catch (err) {
      // Let caller decide (bootstrap / guard)
      throw err;
    }
  },

  /**
   * Refresh access token
   * - Silent failure (handled by axios interceptor)
   */
  refresh: async () => {
    const res = await api.post<{ accessToken: string }>("/api/auth/refresh/", null);
    return res.data;
  },

  /**
   * Logout
   * - Best effort
   * - No toast here (UI handles it)
   */
  logout: async () => {
    try {
      await api.post("/api/auth/logout/", null);
    } catch {
      // ignore — client state will be cleared anyway
    }
  },
};
