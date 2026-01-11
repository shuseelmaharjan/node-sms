"use client";

import React, { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";

import { AppSidebar } from "./components/AppSidebar";
import { DashboardHeader } from "./components/DashboardHeader";
import { navconfig } from "./components/navigation.config";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const year = new Date().getFullYear();

  if (isLoading) {
    return (
      <div className="min-h-svh grid place-items-center bg-background">
        <div className="rounded-xl border bg-card px-6 py-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar navItems={navconfig} />

      <SidebarInset className="min-h-svh">
        <DashboardHeader pageTitle="Dashboard" />

        <main className="flex flex-1 flex-col">
          <div className="flex-1 p-4">
            <Suspense
              fallback={
                <div className="grid place-items-center py-10">
                  <p className="text-sm text-muted-foreground">Loading…</p>
                </div>
              }
            >
              {children}
            </Suspense>
          </div>

          <footer className="border-t bg-background px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>© {year} Institute Management System</span>
              <span className="opacity-80">Education Platform</span>
            </div>
          </footer>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
