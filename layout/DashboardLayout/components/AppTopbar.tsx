"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AppTopbar({
  username,
  title = "Dashboard",
  subtitle,
}: {
  username?: string;
  title?: string;
  subtitle?: string;
}) {
  const { logout } = useAuth();

  const initials = (username?.trim()?.[0] || "U").toUpperCase();

  return (
    <div className="flex w-full items-center justify-between gap-3">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="p-2 hover:bg-accent/50 rounded-lg transition-colors md:hidden" />

        <div className="min-w-0">
          <h1 className="truncate text-base sm:text-lg font-semibold text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "relative inline-flex items-center justify-center",
                "h-10 w-10 rounded-full border bg-white",
                "hover:bg-accent/50 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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

        {/* Divider */}
        <div className="hidden sm:block h-8 w-px bg-border" />

        {/* Account */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "group inline-flex items-center gap-2",
                "h-10 rounded-full border bg-white px-2.5",
                "hover:bg-accent/50 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              )}
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="hidden sm:flex min-w-0 flex-col items-start leading-none">
                <span className="max-w-[160px] truncate text-sm font-semibold capitalize text-foreground">
                  {username || "User"}
                </span>
                <span className="max-w-[160px] truncate text-[11px] text-muted-foreground">
                  Administrator
                </span>
              </div>

              <ChevronDown
                size={16}
                className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
              />
            </button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-64 p-2">
            <div className="px-2 py-2">
              <p className="text-sm font-semibold text-foreground">{username || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">Signed in</p>
            </div>

            <div className="my-2 h-px bg-border" />

            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                // route later if you want
              }}
            >
              <User size={16} className="text-muted-foreground" />
              Profile
            </Button>

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
  );
}
