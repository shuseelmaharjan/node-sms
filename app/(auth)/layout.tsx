"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  console.log('AuthLayout render:', { isLoading, isAuthenticated });

  useEffect(() => {
    // If authenticated, redirect to dashboard immediately
    if (isAuthenticated && !isLoading) {
      console.log('AuthLayout: User authenticated, redirecting to dashboard');
      // Use replace to avoid back button issues
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show minimal loading during quick auth check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show success state while redirecting  
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-pulse rounded-full h-8 w-8 bg-green-500"></div>
          <p className="text-sm text-green-600 font-medium">Login successful! Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
