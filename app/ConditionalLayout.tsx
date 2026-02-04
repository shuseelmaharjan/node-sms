"use client";

import { usePathname } from "next/navigation";
import { DashboardLayout } from "@/layout";
import { PUBLIC_ROUTES, isRouteInList } from "@/config/routes";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui/spinner";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading } = useAuth();

  const isPublic = isRouteInList(pathname, PUBLIC_ROUTES) || pathname.startsWith("/api");
  if (isPublic) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Spinner />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
