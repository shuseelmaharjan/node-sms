// lib/auth/RequireAuth.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./hooks";
import { PUBLIC_ROUTES, isRouteInList, isIgnoredPath, isSystemPath } from "@/router/routes";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ignore next internals / api etc
  const ignored = isIgnoredPath(pathname);

  // allow system routes like /not-found, /forbidden
  const system = isSystemPath(pathname);

  // public pages like /login, /register
  const isPublic = isRouteInList(pathname, PUBLIC_ROUTES);

  useEffect(() => {
    if (isLoading) return;
    if (ignored || system || isPublic) return;

    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/overview")}`);
    }
  }, [isAuthenticated, isLoading, ignored, system, isPublic, pathname, router]);

  if (ignored || system || isPublic) return <>{children}</>;
  if (isLoading) return null;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
