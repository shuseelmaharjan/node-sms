// lib/auth/components.tsx

"use client";

import { useAuthGuard } from "./guard";
import { Spinner } from "@/components/ui/spinner";

interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireAuth({ 
  children, 
  fallback = <AuthGuardLoader /> 
}: RequireAuthProps) {
  const { isAuthenticated, isChecking, isPublicRoute } = useAuthGuard();

  if (isChecking) {
    return <>{fallback}</>;
  }

  if (isPublicRoute || isAuthenticated) {
    return <>{children}</>;
  }

  return null; // Redirecting, show nothing
}

export function AuthGuardLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex items-center gap-2">
        <Spinner />
        <span className="text-sm">Loading data...</span>
      </div>
    </div>
  );
}