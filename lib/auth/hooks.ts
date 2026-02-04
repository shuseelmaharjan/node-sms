"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "./store";
import { login as loginSession, logout as logoutSession } from "./session";

// keep in sync with middleware + ConditionalLayout
const PUBLIC_ROUTES = ["/login", "/register", "/forget-password"];

export function useAuth() {
  const { user, accessToken, sessionValid, hydrated } = useAuthStore();

  return {
    user,
    accessToken,
    sessionValid,
    isAuthenticated: Boolean(accessToken && user && sessionValid),
    isLoading: !hydrated,
    login: loginSession,
    logout: logoutSession,
  };
}

export function useAuthGuard() {
  const { accessToken, user, hydrated, sessionValid } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const [isChecking, setIsChecking] = useState(true);

  const isAuthenticated = Boolean(accessToken && user && sessionValid);

  const isPublicRoute = useMemo(() => {
    return PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );
  }, [pathname]);

  useEffect(() => {
    if (!hydrated) return;

    if (!isPublicRoute && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      setIsChecking(false);
      return;
    }

    setIsChecking(false);
  }, [hydrated, isPublicRoute, isAuthenticated, pathname, router]);

  return {
    isAuthenticated,
    isChecking: !hydrated || isChecking,
    isPublicRoute,
    user,
  };
}
