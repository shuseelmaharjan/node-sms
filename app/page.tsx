"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui/spinner";

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User is authenticated, redirect to overview (dashboard)
        router.replace("/overview");
      } else {
        // User is not authenticated, redirect to login
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-2">
        <Spinner />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}