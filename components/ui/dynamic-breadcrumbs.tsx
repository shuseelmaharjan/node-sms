"use client";

import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import { navconfig, type NavItem, type NavChild } from "@/layout/DashboardLayout/components/navigation.config";

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
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbSegment[] = [];

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
      icon: config?.icon && index === 0 ? config.icon : undefined,
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
  className 
}: DynamicBreadcrumbsProps) {
  const pathname = usePathname();
  
  const breadcrumbs = useMemo(() => {
    let crumbs = generateBreadcrumbs(pathname);
    
    // Handle breadcrumb overflow with ellipsis
    if (crumbs.length > maxItems) {
      const first = crumbs[0];
      const last = crumbs.slice(-2); // Keep last 2 items
      crumbs = [first, { label: '...' }, ...last];
    }
    
    return crumbs;
  }, [pathname, maxItems]);

  if (breadcrumbs.length === 0) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isEllipsis = crumb.label === '...';
          
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && !isEllipsis && (
                <BreadcrumbSeparator>
                  <ChevronRight />
                </BreadcrumbSeparator>
              )}
              
              <BreadcrumbItem>
                {isEllipsis ? (
                  <BreadcrumbEllipsis />
                ) : crumb.href ? (
                  <Link 
                    href={crumb.href} 
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.icon}
                    <span className="hidden sm:inline">{crumb.label}</span>
                    {/* Show icon only on small screens for first item */}
                    {index === 0 && crumb.icon && (
                      <span className="sm:hidden">{crumb.icon}</span>
                    )}
                  </Link>
                ) : (
                  <BreadcrumbPage className="flex items-center gap-1.5 font-semibold">
                    {crumb.icon}
                    {crumb.label}
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