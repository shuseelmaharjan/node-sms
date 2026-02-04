"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { DynamicBreadcrumbs } from "@/components/ui/dynamic-breadcrumbs";
import { LogoutConfirmDialog } from "./LogoutConfirmDialog"; 

export function DashboardHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const email = user?.email ?? "user@gmail.com";
  const fullName = user?.name ?? "Signed in";
  const initials = (email?.[0] ?? "U").toUpperCase();

  async function handleLogoutConfirm() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await logout(); // clears store + calls server logout (best effort)
      // go to login; middleware will allow because cookie is cleared
      router.replace("/login");
      router.refresh(); // optional but helps clear cached layouts
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  }

  return (
    <>
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

            <div className="min-w-0 flex-1">
              <DynamicBreadcrumbs maxItems={4} className="max-w-full" />
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-1.5 sm:gap-2">
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

              <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-80 p-3">
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

                  <div className="hidden sm:flex min-w-0 flex-col items-start leading-none">
                    <span className="max-w-[180px] truncate text-sm font-semibold text-foreground">
                      {email}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {fullName}
                    </span>
                  </div>

                  <ChevronDown
                    size={16}
                    className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                  />
                </button>
              </PopoverTrigger>

              <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-64 p-2">
                <div className="px-2 py-2">
                  <p className="text-sm font-semibold text-foreground">{email}</p>
                  <p className="text-xs text-muted-foreground truncate">{fullName}</p>
                </div>

                <div className="my-2 h-px bg-border" />

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={() => setLogoutOpen(true)}
                  disabled={loggingOut}
                >
                  <LogOut size={16} />
                  Logout
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <LogoutConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        loading={loggingOut}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
