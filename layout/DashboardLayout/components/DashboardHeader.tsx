"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { DynamicBreadcrumbs } from "@/components/ui/dynamic-breadcrumbs";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const email = user?.email ?? "user@gmail.com";
  const firstName = user?.first_name ?? "User";
  const lastName = user?.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = (email?.[0] ?? "U").toUpperCase();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full",
        "border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2",
          "h-14 px-3 sm:h-16 sm:px-6",
          "transition-[height] ease-linear",
          "group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
        )}
      >
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="flex md:hidden rounded-lg p-2 hover:bg-accent/50 transition-colors" />

          {/* <Separator orientation="vertical" className="mx-1 h-5 sm:mx-2" /> */}

          {/* Breadcrumbs scroll on mobile */}
          <div className="min-w-0 flex-1">
            <DynamicBreadcrumbs
              maxItems={4}
              className="max-w-full"
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "relative inline-flex items-center justify-center cursor-pointer",
                  "h-9 w-9 sm:h-10 sm:w-10",
                  "rounded-full border bg-background",
                  "hover:bg-accent/50 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                )}
                aria-label="Notifications"
              >
                <Bell size={18} className="text-muted-foreground" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive" />
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              className="w-[calc(100vw-2rem)] max-w-80 p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Notifications</p>
                <span className="text-xs text-muted-foreground">0 new</span>
              </div>

              <div className="mt-3 rounded-md border bg-background p-3">
                <p className="text-sm text-muted-foreground">
                  No new notifications.
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <div className="hidden sm:block h-8 w-px bg-border mx-1" />

          {/* USER MENU */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "group inline-flex items-center gap-2 cursor-pointer py-1",
                  "h-9 sm:h-10 rounded-full border bg-background px-2 sm:px-2.5",
                  "transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                )}
                aria-label="Account menu"
              >
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Hide text on mobile */}
                <div className="hidden sm:flex min-w-0 flex-col items-start leading-none">
                  <span className="max-w-[180px] truncate text-sm font-semibold text-foreground">
                    {email}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {fullName || "Signed in"}
                  </span>
                </div>

                <ChevronDown
                  size={16}
                  className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                />
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              className="w-[calc(100vw-2rem)] max-w-64 p-2"
            >
              <div className="px-2 py-2">
                <p className="text-sm font-semibold text-foreground">
                  {email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Signed in
                </p>
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
