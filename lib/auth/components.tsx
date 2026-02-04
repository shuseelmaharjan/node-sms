// lib/auth/components.tsx
"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { canAccessRoute } from "@/router/routes";
import { Spinner } from "@/components/ui/spinner";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { hydrated, sessionValid, user } = useAuthStore();

  // Loading gate
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2">
        <Spinner />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  // Not logged in
  if (!sessionValid || !user) {
    const redirect = encodeURIComponent(pathname || "/overview");
    router.replace(`/login?redirect=${redirect}`);
    return null;
  }

  // RBAC check
  const allowed = canAccessRoute(user.role, pathname);
  if (!allowed) {
    router.replace("/forbidden");
    return null;
  }

  return <>{children}</>;
}
