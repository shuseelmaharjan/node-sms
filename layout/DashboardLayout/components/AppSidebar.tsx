"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { NavItem, NavChild } from "./navigation.config";

/* helpers */
function isPathActive(href: string, pathname: string, exactMatch?: boolean) {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  if (exactMatch) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
function matchOne(m: string | RegExp, pathname: string) {
  if (typeof m === "string") return pathname === m || pathname.startsWith(`${m}/`);
  return m.test(pathname);
}
function isHrefOrMatchActive(
  href: string,
  pathname: string,
  exactMatch?: boolean,
  match?: Array<string | RegExp>
) {
  if (isPathActive(href, pathname, exactMatch)) return true;
  if (!match?.length) return false;
  return match.some((m) => matchOne(m, pathname));
}
function isNavChildActive(child: NavChild, pathname: string): boolean {
  if ("href" in child) {
    return isHrefOrMatchActive(child.href, pathname, child.exactMatch, child.match);
  }
  return child.children.some((c) => isNavChildActive(c, pathname));
}

/* child renderer */
function RenderNavChild({ child, pathname }: { child: NavChild; pathname: string }) {
  if ("href" in child) {
    const isActive = isHrefOrMatchActive(child.href, pathname, child.exactMatch, child.match);

    return (
      <SidebarMenuSubItem className="relative">
        <SidebarMenuSubButton
          asChild
          isActive={isActive}
          className={cn(
            // base
            "group relative rounded-lg px-3 py-2 text-sm transition-all",
            "hover:bg-accent/60 hover:text-foreground",
            // active
            isActive
              ? "bg-primary/12 text-primary font-semibold shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
              : "text-muted-foreground"
          )}
        >
          <Link href={child.href} className="flex items-center gap-2">
            {/* small dot indicator */}
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-opacity",
                isActive ? "opacity-100 bg-primary" : "opacity-40 bg-muted-foreground group-hover:opacity-70"
              )}
            />
            <span className="truncate">{child.label}</span>
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  const isGroupActive = child.children.some((c) => isNavChildActive(c, pathname));

  return (
    <Collapsible defaultOpen={isGroupActive}>
      <SidebarMenuSubItem className="rounded-lg">
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton
            className={cn(
              "group rounded-lg px-3 py-2 text-sm transition-colors",
              "hover:bg-accent/60 hover:text-foreground",
              isGroupActive ? "text-foreground font-semibold" : "text-muted-foreground"
            )}
          >
            <span className="truncate">{child.label}</span>
            <ChevronDown className="ml-auto size-4 opacity-70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub className="mt-1 ml-3 border-l border-border/70 pl-3 space-y-1">
            {child.children.map((sub) => (
              <RenderNavChild key={sub.label} child={sub} pathname={pathname} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  );
}

type AppSidebarProps = {
  navItems: NavItem[];
  logoSrc?: string;
};

export function AppSidebar({ navItems, logoSrc = "/logo.svg" }: AppSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r",
        // nicer background + subtle depth
        "bg-gradient-to-b from-background to-muted/25"
      )}
    >
      {/* Header */}
      <SidebarHeader className="px-3 pt-4 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "rounded-2xl px-2 py-2 transition-all",
                "hover:bg-accent/50",
                "shadow-sm shadow-black/5"
              )}
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-2xl",
                  "bg-primary/10 ring-1 ring-primary/15"
                )}
              >
                {collapsed ? (
                  <span className="text-primary font-extrabold text-sm tracking-tight">IM</span>
                ) : (
                  <Image
                    src={logoSrc}
                    alt="Institute Logo"
                    width={140}
                    height={40}
                    priority
                    className="h-7 w-auto"
                  />
                )}
              </div>

              {!collapsed && (
                <div className="ml-2 grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold text-foreground">
                    Institute Management
                  </span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* subtle divider */}
      </SidebarHeader>

      {/* Content */}
      <SidebarContent
        className={cn(
          "px-2 pb-2",
          "overflow-y-auto",
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        )}
      >
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navItems.map((item) => {
                // parent
                if ("children" in item) {
                  const isParentActive = item.children.some((child) =>
                    isNavChildActive(child, pathname)
                  );

                  return (
                    <Collapsible key={item.label} defaultOpen={isParentActive}>
                      <SidebarMenuItem className="relative">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={cn(
                              "group relative rounded-xl py-3 transition-all",
                              "hover:bg-accent/60",
                              // more “pill” active state
                              isParentActive &&
                                "bg-primary/12 text-primary font-semibold shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
                            )}
                          >
                            {/* left glow bar */}
                            <span
                              className={cn(
                                "absolute left-0 top-2.5 h-8 w-1 rounded-r transition-opacity",
                                isParentActive ? "bg-primary opacity-100" : "opacity-0"
                              )}
                            />
                            <item.icon
                              size={18}
                              className={cn(
                                "transition-colors",
                                isParentActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                              )}
                            />
                            <span className="truncate">{item.label}</span>

                            {!collapsed && (
                              <ChevronDown className="ml-auto size-4 opacity-70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        {!collapsed && (
                          <CollapsibleContent>
                            <SidebarMenuSub className="mt-1.5 px-1.5 space-y-1">
                              {item.children.map((sub) => (
                                <RenderNavChild key={sub.label} child={sub} pathname={pathname} />
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // leaf
                const isActive = isHrefOrMatchActive(
                  item.href,
                  pathname,
                  item.exactMatch,
                  item.match
                );

                return (
                  <SidebarMenuItem key={item.label} className="relative">
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "group relative rounded-xl py-3 transition-all",
                        "hover:bg-accent/60",
                        isActive &&
                          "bg-primary/12 text-primary font-semibold shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-2">
                        {/* left glow bar */}
                        <span
                          className={cn(
                            "absolute left-0 top-2.5 h-8 w-1 rounded-r transition-opacity",
                            isActive ? "bg-primary opacity-100" : "opacity-0"
                          )}
                        />

                        <item.icon
                          size={18}
                          className={cn(
                            "transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-2 py-3">
        <div className="mb-2 h-px w-full bg-border/70" />

        <SidebarMenu className="gap-1.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={cn(
                "rounded-xl py-3 transition-colors",
                "hover:bg-accent/60"
              )}
            >
              <Link href="/help" className="flex items-center justify-between">
                <span className="truncate text-sm text-muted-foreground">
                  Help & Support
                </span>
                <span className="text-xs text-muted-foreground/80">
                  F1
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
