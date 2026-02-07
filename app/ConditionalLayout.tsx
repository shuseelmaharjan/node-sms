// app/ConditionalLayout.tsx
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { RequireAuth } from "@/lib/auth/components";
import { DashboardLayout } from "@/layout";
import { isIgnoredPath, isPublicPath, isSystemPath, isKnownPrivateRoute } from "@/router/routes";
import { useAuthStore } from "@/lib/auth/store";
import { Spinner } from "@/components/ui/spinner";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hydrated } = useAuthStore();

  if (isIgnoredPath(pathname)) return <>{children}</>;
  if (isPublicPath(pathname)) return <>{children}</>;
  if (isSystemPath(pathname)) return <>{children}</>;

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2">
        <Spinner />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  // If unknown, let Next handle it
  if (!isKnownPrivateRoute(pathname)) return <>{children}</>;

  return (
    <RequireAuth>
      <DashboardLayout>{children}</DashboardLayout>
    </RequireAuth>
  );
}
