"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { settingsNavConfig } from "@/layout/Settings/navconfig";

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

interface SettingsSidebarProps {
  onItemClick?: () => void;
  showHeader?: boolean;
  compact?: boolean; // ✅ new
}

export function SettingsSidebar({
  onItemClick,
  showHeader = true,
  compact = false,
}: SettingsSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="rounded-none md:rounded-2xl border-none md:border bg-card/80 shadow-none md:shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
      {/* Header */}
      {showHeader && (
        <div className="border-b px-4 py-4">
          <h2 className="text-sm font-semibold leading-none sm:text-base">
            Settings
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Manage system configuration
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className={cn("p-2", compact && "p-1.5")}>
        <div className={cn("space-y-1", compact && "space-y-0.5")}>
          {settingsNavConfig.map((item) => {
            const active = isActive(pathname, item.href, item.exactMatch);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",

                  // sizing: mobile-first big tap target, slightly tighter in compact mode
                  compact
                    ? "px-2.5 py-2"
                    : "px-3 py-3 sm:py-2.5",

                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {/* Active indicator */}
                <span
                  className={cn(
                    "absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full transition",
                    active ? "bg-primary" : "bg-transparent group-hover:bg-primary/40"
                  )}
                />

                {/* Icon pill */}
                <span
                  className={cn(
                    "grid place-items-center rounded-xl border transition",
                    // responsive icon size
                    compact ? "h-9 w-9" : "h-10 w-10 sm:h-9 sm:w-9",
                    active
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-transparent bg-muted/40 text-muted-foreground group-hover:bg-muted/60 group-hover:text-foreground"
                  )}
                >
                  <Icon size={18} />
                </span>

                {/* Label */}
                <div className="min-w-0 flex-1">
                  <span
                    className={cn(
                      // mobile-friendly font sizing
                      "block leading-snug",
                      compact ? "text-[13px]" : "text-sm",
                      active && "font-medium",
                      // allow wrapping instead of truncation
                      "whitespace-normal break-words [overflow-wrap:anywhere]"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
