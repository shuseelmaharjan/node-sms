"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "./store";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login"];

export function useAuthGuard() {
  const { accessToken, user, hydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  const isAuthenticated = Boolean(accessToken && user);
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  useEffect(() => {
    if (!hydrated) return; // Wait for auth state to hydrate

    // If user is not authenticated and on a protected route, redirect to login
    if (!isPublicRoute && !isAuthenticated) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
      return;
    }

    setIsChecking(false);
  }, [isAuthenticated, isPublicRoute, hydrated, pathname, router]);

  return {
    isAuthenticated,
    isChecking: !hydrated || isChecking,
    isPublicRoute,
    user,
  };
}