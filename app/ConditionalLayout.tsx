"use client";

import { usePathname } from "next/navigation";
import { RequireAuth } from "@/lib/auth/components";
import { DashboardLayout } from "@/layout";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Routes that should not have dashboard layout (auth routes, debug routes, api routes)
  const publicRoutes = ["/login", "/register", "/debug-auth", "/debug-cookies", "/api"];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith("/api/");
  
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Apply dashboard layout to all other routes
  return (
    <RequireAuth>
      <DashboardLayout>{children}</DashboardLayout>
    </RequireAuth>
  );
}