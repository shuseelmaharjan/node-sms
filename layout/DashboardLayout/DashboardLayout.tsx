"use client";

import { AppSidebar } from "./components/AppSidebar";
import { Suspense, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { navconfig } from "./components/navigation.config";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardHeader } from "./components/DashboardHeader";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Authentication is handled by the auth provider
  }, []);

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
      <SidebarInset>
        <DashboardHeader pageTitle="Dashboard" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-muted-foreground">Loading…</div>
            </div>
          }>
            {children}
          </Suspense>
          
          <footer className="mt-auto border-t bg-background px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} Institute Management System</span>
              <span className="opacity-80">Education Platform</span>
            </div>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
