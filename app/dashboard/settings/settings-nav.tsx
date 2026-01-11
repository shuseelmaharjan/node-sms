"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard/settings/campuses", label: "Campuses" },
  // future:
  // { href: "/settings/schools", label: "Schools" },
  // { href: "/settings/departments", label: "Departments" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent/60",
              active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
