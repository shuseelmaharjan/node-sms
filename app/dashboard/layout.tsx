"use client";

import { DashboardLayout } from "@/layout";
import { RequireAuth } from "@/lib/auth/components";

export default function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <DashboardLayout>{children}</DashboardLayout>
    </RequireAuth>
  );
}