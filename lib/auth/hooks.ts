// lib/auth/hooks.ts
"use client";

import { useAuthStore } from "./store";
import { login, logout as baseLogout } from "./session";

export function useAuth() {
  const { user, accessToken, sessionValid, hydrated } = useAuthStore();

  return {
    user,
    accessToken,
    sessionValid,
    isAuthenticated: Boolean(accessToken && user && sessionValid),
    isLoading: !hydrated,
    login,
    logout: baseLogout,
  };
}
