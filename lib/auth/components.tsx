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

  const { hydrated, bootstrapped, sessionValid, user } = useAuthStore();

  const redirectToLogin = React.useMemo(() => {
    const redirect = encodeURIComponent(pathname || "/overview");
    return `/login?redirect=${redirect}`;
  }, [pathname]);

  const allowed = React.useMemo(() => {
    if (!user?.role) return false;
    return canAccessRoute(user.role, pathname);
  }, [user?.role, pathname]);

  React.useEffect(() => {
    // ✅ wait for bootstrap completion
    if (!hydrated || !bootstrapped) return;

    if (!sessionValid || !user) {
      router.replace(redirectToLogin);
      return;
    }

    if (!allowed) {
      router.replace("/forbidden");
      return;
    }
  }, [hydrated, bootstrapped, sessionValid, user, allowed, router, redirectToLogin]);

  // ✅ loading gate while bootstrapping
  if (!hydrated || !bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2">
        <Spinner />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!sessionValid || !user) return null;
  if (!allowed) return null;

  return <>{children}</>;
}
