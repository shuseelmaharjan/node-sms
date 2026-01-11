import { RequireAuth } from "@/lib/auth/components";
import { DashboardLayout } from "@/layout";

export default function DashboardLayoutGroup({
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