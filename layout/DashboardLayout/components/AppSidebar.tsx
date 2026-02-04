// layout/DashboardLayout/components/AppSidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import type { NavItem, NavChild } from "./navigation.config";
import { useAuthStore } from "@/lib/auth/store";
import type { UserRole } from "@/router/routes";

function allowedByRoles(userRole: string | undefined | null, roles?: UserRole[]) {
  if (!roles?.length) return true;
  return roles.includes(userRole as UserRole);
}

function filterNav(items: NavItem[], role: string | undefined | null): NavItem[] {
  return items
    .map((item) => {
      // leaf
      if ("href" in item) {
        return allowedByRoles(role, item.roles) ? item : null;
      }

      // group
      if (!allowedByRoles(role, item.roles)) return null;

      const children = item.children
        .map((c) => {
          if ("href" in c) return allowedByRoles(role, c.roles) ? c : null;

          // nested group inside children
          const nested = filterNav([{ ...(c as any), icon: (null as any) } as NavItem], role); // safe flatten trick
          const nestedChild = (nested[0] as any)?.children as NavChild[] | undefined;
          return nestedChild?.length ? { ...c, children: nestedChild } : null;
        })
        .filter(Boolean) as NavChild[];

      return children.length ? { ...item, children } : null;
    })
    .filter(Boolean) as NavItem[];
}

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
            "group relative rounded-lg px-3 py-2 text-sm transition-all",
            "hover:text-foreground",
            isActive
              ? "bg-primary/12 text-primary font-semibold shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
              : "text-muted-foreground"
          )}
        >
          <Link href={child.href} className="flex items-center gap-2">
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
              "hover:text-foreground",
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

/* collapsed hover/click flyout */
function CollapsedFlyout({
  item,
  pathname,
  collapsed,
}: {
  item: Extract<NavItem, { children: NavChild[] }>;
  pathname: string;
  collapsed: boolean;
}) {
  const isParentActive = item.children.some((child) => isNavChildActive(child, pathname));

  // Hover open for collapsed sidebar, click open for expanded (safer)
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton
          onMouseEnter={() => collapsed && setOpen(true)}
          onMouseLeave={() => collapsed && setOpen(false)}
          className={cn(
            "group relative rounded-xl py-3 transition-all",
            isParentActive && "bg-primary/12 text-primary font-semibold shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
          )}
        >
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
        </SidebarMenuButton>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={10}
        onMouseEnter={() => collapsed && setOpen(true)}
        onMouseLeave={() => collapsed && setOpen(false)}
        className="w-72 p-2"
      >
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold">{item.label}</p>
          <p className="text-xs text-muted-foreground">Quick links</p>
        </div>

        <div className="my-2 h-px bg-border" />

        <div className="space-y-1">
          {item.children.map((child) => (
            <RenderNavChild key={child.label} child={child} pathname={pathname} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type AppSidebarProps = {
  navItems: NavItem[];
  logoSrc?: string;
};

export function AppSidebar({ navItems, logoSrc = "/logo.jpg" }: AppSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const { user } = useAuthStore();

  const filteredNav = React.useMemo(() => {
    return filterNav(navItems, user?.role ?? null);
  }, [navItems, user?.role]);

  return (
    <Sidebar collapsible="icon" className={cn("border-r", "bg-gradient-to-b from-background to-muted/25")}>
      {/* Header */}
      <SidebarHeader className="px-3 pt-4 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "px-2 py-2 transition-none",
                "hover:bg-transparent hover:text-inherit",
                "focus:bg-transparent active:bg-transparent",
                "data-[active=true]:bg-transparent"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center shrink-0",
                  "h-10 w-10 rounded-xl",
                  "bg-primary/10 ring-1 ring-primary/15"
                )}
              >
                {collapsed ? (
                  <span className="text-primary font-extrabold text-sm tracking-tight select-none">
                    {process.env.NEXT_PUBLIC_APP_ORG_SHORTCUT ?? "IMS"}
                  </span>
                ) : (
                  <Image src={logoSrc} alt="Institute Logo" width={120} height={32} priority className="h-7 w-auto object-contain" />
                )}
              </div>

              {!collapsed && (
                <div className="ml-2 grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {process.env.NEXT_PUBLIC_APP_NAME || "Institute Management"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {process.env.NEXT_PUBLIC_APP_TAGLINE || "Empowering Education Management"}
                  </span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent
        className={cn(
          "px-2 pb-2 overflow-y-auto",
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        )}
      >
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {filteredNav.map((item) => {
                // Parent (has children)
                if ("children" in item) {
                  // Collapsed sidebar: show flyout on right (hover)
                  if (collapsed) {
                    return (
                      <SidebarMenuItem key={item.label} className="relative">
                        <CollapsedFlyout item={item} pathname={pathname} collapsed={collapsed} />
                      </SidebarMenuItem>
                    );
                  }

                  // Expanded sidebar: use collapsible
                  const isParentActive = item.children.some((child) => isNavChildActive(child, pathname));

                  return (
                    <Collapsible key={item.label} defaultOpen={isParentActive}>
                      <SidebarMenuItem className="relative">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={cn(
                              "group relative rounded-xl py-3 transition-all",
                              isParentActive && "bg-primary/12 text-primary font-semibold shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
                            )}
                          >
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
                            <ChevronDown className="ml-auto size-4 opacity-70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <SidebarMenuSub className="mt-1.5 px-1.5 space-y-1">
                            {item.children.map((sub) => (
                              <RenderNavChild key={sub.label} child={sub} pathname={pathname} />
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // Leaf item
                const isActive = isHrefOrMatchActive(item.href, pathname, item.exactMatch, item.match);

                return (
                  <SidebarMenuItem key={item.label} className="relative">
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "group relative rounded-xl py-3 transition-all",
                        isActive && "bg-primary/12 text-primary font-semibold shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
                      )}
                    >
                      <Link
                        href={item.href}
                        className={cn("flex items-center", collapsed ? "justify-center gap-0" : "gap-2")}
                      >
                        {!collapsed && (
                          <span
                            className={cn(
                              "absolute left-0 top-2.5 h-8 w-1 rounded-r transition-opacity",
                              isActive ? "bg-primary opacity-100" : "opacity-0"
                            )}
                          />
                        )}

                        <item.icon
                          size={18}
                          className={cn(
                            "transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />

                        {!collapsed && <span className="truncate">{item.label}</span>}
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
        {(() => {
          const appName = process.env.NEXT_PUBLIC_APP_NAME || "School Management System";
          const year = new Date().getFullYear();

          if (collapsed) {
            return (
              <div className="flex items-center justify-center" title={`© ${year} ${appName}`}>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center justify-center">
                  &copy;
                  <span className="ml-1 font-normal">{process.env.NEXT_PUBLIC_APP_ORG_SHORTCUT}</span>
                </div>
              </div>
            );
          }

          return (
            <p className="px-1 text-xs text-muted-foreground leading-relaxed whitespace-normal break-words [overflow-wrap:anywhere]">
              &copy; {year} {appName}
            </p>
          );
        })()}
      </SidebarFooter>
    </Sidebar>
  );
}
