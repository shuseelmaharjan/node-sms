"use client";

import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import { navconfig, type NavItem, type NavChild } from "@/layout/DashboardLayout/components/navigation.config";
import { cn } from "@/lib/utils";

interface BreadcrumbSegment {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

// Build route map from navigation config
function buildRouteMap(): Record<string, { label: string; icon?: React.ReactNode }> {
  const routeMap: Record<string, { label: string; icon?: React.ReactNode }> = {};
  
  function processNavItem(item: NavItem, parentPath: string = '') {
    if ('href' in item) {
      // Direct route
      const IconComponent = item.icon;
      routeMap[item.href] = {
        label: item.label === 'Overview' ? 'Dashboard' : item.label,
        icon: <IconComponent className="h-4 w-4" />
      };
    } else if ('children' in item) {
      // Parent with children
      const IconComponent = item.icon;
      
      // Process children
      item.children.forEach(child => {
        processNavChild(child, item.label, IconComponent);
      });
    }
  }
  
  function processNavChild(child: NavChild, parentLabel: string, ParentIcon?: any) {
    if ('href' in child) {
      routeMap[child.href] = {
        label: child.label,
      };
    } else if ('children' in child) {
      // Nested children
      child.children.forEach(nestedChild => {
        processNavChild(nestedChild, child.label);
      });
    }
  }
  
  navconfig.forEach(item => processNavItem(item));
  
  return routeMap;
}

// Cache the route map
const ROUTE_MAP = buildRouteMap();

function formatSegmentLabel(segment: string): string {
  // Handle UUIDs and other special segments
  if (/^[0-9a-f-]{36}$/.test(segment)) {
    return 'Details'; // Generic label for ID-based routes
  }
  
  // Convert kebab-case to title case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  // If we're on /overview, don't show breadcrumbs (it's the home page)
  if (pathname === '/overview') {
    return [];
  }

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbSegment[] = [];

  // Always add Home as the first breadcrumb pointing to /overview
  breadcrumbs.push({
    label: 'Home',
    href: '/overview',
    icon: <Home className="h-4 w-4" />,
  });

  // Build breadcrumb path progressively
  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Use navigation config route or format segment
    const config = ROUTE_MAP[currentPath];
    const isLast = index === segments.length - 1;
    
    breadcrumbs.push({
      label: config?.label || formatSegmentLabel(segment),
      href: isLast ? undefined : currentPath,
      // No icon for non-home breadcrumbs
    });
  });

  return breadcrumbs;
}

interface DynamicBreadcrumbsProps {
  maxItems?: number;
  showHome?: boolean;
  className?: string;
}

export function DynamicBreadcrumbs({
  maxItems = 3,
  showHome = true,
  className,
}: DynamicBreadcrumbsProps) {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    let crumbs = generateBreadcrumbs(pathname);

    // optional: if you want to remove dashboard from crumbs
    // if (!showHome) crumbs = crumbs.slice(1);

    if (crumbs.length > maxItems) {
      const first = crumbs[0];
      const last = crumbs.slice(-2);
      crumbs = [first, { label: "..." }, ...last];
    }

    return crumbs;
  }, [pathname, maxItems, showHome]);

  if (breadcrumbs.length === 0) return null;

  return (
    <div className={cn("min-w-0", className)}>
      {/* Mobile: horizontal scroll; Desktop: normal */}
      <Breadcrumb>
        <BreadcrumbList
          className={cn(
            "flex items-center",
            // mobile friendly: single line + horizontal scroll
            "max-w-full flex-nowrap overflow-x-auto whitespace-nowrap",
            "scrollbar-hide [-webkit-overflow-scrolling:touch]",
            // spacing tweaks
            "gap-1 sm:gap-1.5"
          )}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const isEllipsis = crumb.label === "...";

            return (
              <Fragment key={`${crumb.label}-${index}`}>
                {/* Separator (don’t show before first OR around ellipsis weirdly) */}
                {index > 0 && !isEllipsis && (
                  <BreadcrumbSeparator className="mx-1 sm:mx-1.5">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                  </BreadcrumbSeparator>
                )}

                {/* Ellipsis item */}
                {isEllipsis ? (
                  <>
                    {/* show separator before ellipsis */}
                    <BreadcrumbSeparator className="mx-1 sm:mx-1.5">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                    </BreadcrumbSeparator>

                    <BreadcrumbItem className="shrink-0">
                      <BreadcrumbEllipsis className="h-4 w-4 text-muted-foreground" />
                    </BreadcrumbItem>

                    {/* show separator after ellipsis */}
                    <BreadcrumbSeparator className="mx-1 sm:mx-1.5">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                    </BreadcrumbSeparator>
                  </>
                ) : (
                  <BreadcrumbItem className="shrink-0">
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs sm:text-sm",
                          "text-muted-foreground hover:text-foreground transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        )}
                      >
                        {/* Show icon only for Home (first item) */}
                        {crumb.icon ? (
                          <>
                            {/* Mobile: icon only */}
                            <span className="sm:hidden">{crumb.icon}</span>
                            {/* Desktop: icon + label */}
                            <span className="hidden sm:inline-flex items-center gap-1.5">
                              {crumb.icon}
                              {crumb.label}
                            </span>
                          </>
                        ) : (
                          <span className="max-w-[18ch] sm:max-w-none truncate">
                            {crumb.label}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <BreadcrumbPage
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1",
                          "text-xs sm:text-sm font-semibold",
                          "max-w-[22ch] truncate"
                        )}
                      >
                        {/* Don't show icon for current page, only for Home link */}
                        <span className="truncate">{crumb.label}</span>
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                )}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

// Simple breadcrumb for basic use cases
interface SimpleBreadcrumbsProps {
  items: Array<{ label: string; href?: string }>;
  className?: string;
}

export function SimpleBreadcrumbs({ items, className }: SimpleBreadcrumbsProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 && (
                <BreadcrumbSeparator>
                  <ChevronRight />
                </BreadcrumbSeparator>
              )}
              
              <BreadcrumbItem>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <BreadcrumbPage className={isLast ? "font-semibold" : undefined}>
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}