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
        {/* active indicator */}
        {isActive && <span className="absolute left-0 top-2 h-6 w-1 rounded-r bg-primary" />}

        <SidebarMenuSubButton
          asChild
          isActive={isActive}
          className={cn(
            "rounded-md pl-7 pr-3 py-2 text-sm transition-colors",
            "hover:bg-accent/50",
            isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
          )}
        >
          <Link href={child.href}>
            <span className="truncate">{child.label}</span>
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  const isGroupActive = child.children.some((c) => isNavChildActive(c, pathname));

  return (
    <Collapsible defaultOpen={isGroupActive}>
      <SidebarMenuSubItem className="rounded-md">
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton
            className={cn(
              "rounded-md py-2 pl-4 pr-2 text-sm transition-colors",
              "hover:bg-accent/50",
              isGroupActive ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            <span className="truncate">{child.label}</span>
            <ChevronDown className="ml-auto size-4 opacity-70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub className="ml-3 mt-1 border-l border-border pl-2">
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
  logoSrc?: string; // ✅ keep logo support
};

export function AppSidebar({ navItems, logoSrc = "/logo.svg" }: AppSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r bg-white">
      {/* Header */}
      <SidebarHeader className="px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="rounded-xl hover:bg-accent/40">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                {collapsed ? (
                  <span className="text-primary font-bold text-sm">IM</span>
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
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold text-foreground">
                    Institute Management
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Education Platform
                  </span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content (scrollbar hidden) */}
      <SidebarContent
        className={cn(
          "px-2",
          "overflow-y-auto",
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        )}
      >
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                // parent
                if ("children" in item) {
                  const isParentActive = item.children.some((child) =>
                    isNavChildActive(child, pathname)
                  );

                  return (
                    <Collapsible key={item.label} defaultOpen={isParentActive}>
                      <SidebarMenuItem className="relative">
                        {isParentActive && (
                          <span className="absolute left-0 top-2 h-8 w-1 rounded-r bg-primary" />
                        )}

                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={cn(
                              "rounded-lg py-3 transition-colors",
                              "hover:bg-accent/50",
                              isParentActive && "bg-primary/10 text-primary font-semibold"
                            )}
                          >
                            <item.icon
                              size={18}
                              className={cn(
                                isParentActive ? "text-primary" : "text-muted-foreground"
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
                            <SidebarMenuSub className="mt-1 px-1">
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
                    {isActive && (
                      <span className="absolute left-0 top-2 h-8 w-1 rounded-r bg-primary" />
                    )}

                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "rounded-lg py-3 transition-colors",
                        "hover:bg-accent/50",
                        isActive && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-2">
                        <item.icon
                          size={18}
                          className={cn(isActive ? "text-primary" : "text-muted-foreground")}
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
      <SidebarFooter className="px-2 py-3 border-t">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="rounded-lg py-3 hover:bg-accent/50">
              <Link href="/help">
                <span className="truncate text-sm text-muted-foreground">Help & Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
