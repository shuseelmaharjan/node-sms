// app/(auth)/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/hooks";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      const redirect = searchParams.get("redirect") || "/overview";
      router.replace(redirect);
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  if (isLoading) return null; // or a loader

  return <>{children}</>;
}
