"use client";

import { usePathname } from "next/navigation";
import { RequireAuth } from "@/lib/auth/components";
import { DashboardLayout } from "@/layout";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Routes that should NOT have dashboard layout or auth protection
  const publicRoutes = [
    "/login",
    "/register",
    "/forget-password",
    "/debug-auth",
    "/debug-cookies",
  ];

  const isPublicRoute =
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    ) || pathname.startsWith("/api");

  if (isPublicRoute) {
    return <>{children}</>;
  }

  // All other routes require authentication + dashboard layout
  return (
    <RequireAuth>
      <DashboardLayout>{children}</DashboardLayout>
    </RequireAuth>
  );
}
