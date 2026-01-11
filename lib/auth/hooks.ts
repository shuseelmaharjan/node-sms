"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { login as authLogin, logout as authLogout, bootstrapSession } from "@/lib/auth/session";
import { useConfirmation } from "@/components/ui/confirmation-modal";

export function useAuth() {
  const { accessToken, user, hydrated, isInitialized, sessionValid } = useAuthStore();
  const { showConfirmation } = useConfirmation();
  const router = useRouter();

  // User is authenticated if they have both access token AND user data
  const isAuthenticated = Boolean(accessToken && user && sessionValid);
  
  // Loading only during initial hydration/initialization
  const isLoading = !hydrated || !isInitialized;

  // Debug logging
  useEffect(() => {
    console.log('useAuth state change:', {
      hasToken: Boolean(accessToken),
      hasUser: Boolean(user), 
      sessionValid,
      isAuthenticated,
      isLoading,
      hydrated,
      isInitialized
    });
  }, [accessToken, user, sessionValid, isAuthenticated, isLoading, hydrated, isInitialized]);

  // Initialize auth on first mount
  useEffect(() => {
    if (!isInitialized) {
      console.log('useAuth: Initializing auth...');
      bootstrapSession();
    }
  }, [isInitialized]);

  // Custom logout with modal confirmation
  const logout = async () => {
    const confirmed = await showConfirmation({
      title: "Sign Out",
      description: "Are you sure you want to sign out? You will need to log in again to access your account.",
      confirmText: "Sign Out",
      cancelText: "Cancel",
      variant: "destructive"
    });
    
    if (confirmed) {
      await authLogout(true, router); // Pass router for better redirect
    }
  };

  return {
    // State
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    sessionValid,
    
    // Actions
    login: authLogin,
    logout,
    logoutWithoutConfirmation: () => authLogout(true, router), // Skip confirmation, use router
  };
}