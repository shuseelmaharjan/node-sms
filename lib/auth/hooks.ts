"use client";

import { useAuthStore } from "@/lib/auth/store";
import { login as authLogin, logout as authLogout } from "@/lib/auth/session";

export function useAuth() {
  const { accessToken, user, hydrated } = useAuthStore();

  const isAuthenticated = Boolean(accessToken && user);
  const isLoading = !hydrated;

  return {
    // State
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    
    // Actions
    login: authLogin,
    logout: authLogout,
  };
}