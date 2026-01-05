"use client";

import { useAuthGuard } from "./guard";

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
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}