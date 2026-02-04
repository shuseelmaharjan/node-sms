"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { RequireAuth } from "@/lib/auth/components";
import { DashboardLayout } from "@/layout";
import { isIgnoredPath, isPublicPath, isKnownPrivateRoute } from "@/router/routes";
import { useAuthStore } from "@/lib/auth/store";
import { Spinner } from "@/components/ui/spinner";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated } = useAuthStore();

  // ignore next internals / api etc
  if (isIgnoredPath(pathname)) return <>{children}</>;

  // public pages no auth layout
  if (isPublicPath(pathname)) return <>{children}</>;

  // Wait for auth to be hydrated before checking routes
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2">
        <Spinner />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  // if not matched to any private route rule => 404
  if (!isKnownPrivateRoute(pathname)) {
    router.replace("/not-found");
    return null;
  }

  // private pages: auth + role + dashboard layout
  return (
    <RequireAuth>
      <DashboardLayout>{children}</DashboardLayout>
    </RequireAuth>
  );
}
