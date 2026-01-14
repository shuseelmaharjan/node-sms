"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "./store";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login"];

export function useAuthGuard() {
  const { accessToken, user, hydrated, sessionValid } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  const isAuthenticated = Boolean(accessToken && user && sessionValid);
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  useEffect(() => {
  if (!hydrated) return;

  if (!isPublicRoute && !isAuthenticated) {
    router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    router.refresh();
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