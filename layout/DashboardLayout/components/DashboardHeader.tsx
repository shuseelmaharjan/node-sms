"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  pageTitle = "Institute Management",
}: {
  pageTitle?: string;
}) {
  const { user, logout } = useAuth();
  const email = user?.email ?? "User";
  const initials = (email?.[0] ?? "U").toUpperCase();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full",
        "border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center justify-between gap-3 px-4 sm:px-6",
          "transition-[height] ease-linear",
          "group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
        )}
      >
        {/* Left */}
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1 rounded-md hover:bg-accent/50 transition-colors" />

          <Separator orientation="vertical" className="mx-2 h-5" />

          <Breadcrumb>
            <BreadcrumbList className="min-w-0">
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate font-semibold text-foreground">
                  {pageTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "relative inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white",
                  "hover:bg-accent/50 transition-colors"
                )}
                aria-label="Notifications"
              >
                <Bell size={18} className="text-muted-foreground" />
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-destructive" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Notifications</p>
                <span className="text-xs text-muted-foreground">0 new</span>
              </div>
              <div className="mt-3 rounded-md border bg-background p-3">
                <p className="text-sm text-muted-foreground">No new notifications.</p>
              </div>
            </PopoverContent>
          </Popover>

          <div className="hidden sm:block h-8 w-px bg-border mx-1" />

          {/* User menu */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "group inline-flex h-10 items-center gap-2 rounded-full border bg-white px-2.5",
                  "hover:bg-accent/50 transition-colors"
                )}
                aria-label="Account menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden sm:flex min-w-0 flex-col items-start leading-none">
                  <span className="max-w-[180px] truncate text-sm font-semibold text-foreground">
                    {email}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Administrator</span>
                </div>

                <ChevronDown size={16} className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-64 p-2">
              <div className="px-2 py-2">
                <p className="text-sm font-semibold text-foreground">{email}</p>
                <p className="text-xs text-muted-foreground truncate">Signed in</p>
              </div>

              <div className="my-2 h-px bg-border" />

              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={() => logout()}
              >
                <LogOut size={16} />
                Logout
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
