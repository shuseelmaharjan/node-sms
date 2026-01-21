"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

function AuthGate({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full max-w-md rounded-2xl border bg-white/70 shadow-sm backdrop-blur p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl border bg-slate-50 grid place-items-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{label}</p>
            <p className="text-xs text-slate-500">Please wait a moment…</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      const redirect = searchParams.get("redirect");
      router.replace(redirect || "/overview");
      // router.refresh(); // optional: usually not needed
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  // While auth is being checked, show a single consistent loading UI
  if (isLoading) return <AuthGate label="Checking authentication…" />;

  // If authenticated, we’re redirecting: show a lightweight redirect gate
  if (isAuthenticated) return <AuthGate label="Redirecting…" />;

  // Not authenticated: show login page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
