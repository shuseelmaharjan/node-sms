// src/router/routes.ts
export const PUBLIC_ROUTES = [
  "/login", 
  "/register", 
  "/forget-password",
  "/debug-auth",
  "/debug-cookies"
] as const;
export const IGNORE_PREFIXES = ["/api", "/_next", "/favicon.ico"] as const;

// Helper: checks exact route or nested route
export function isRouteInList(pathname: string, routes: readonly string[]) {
  return routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export const USER_ROLES = [
  "superadmin",
  "admin",
  "principal",
  // "vice_principal",
  "teacher",
  "coordinator",
  "accountant",
  "cashier",
  // "admissions",
  // "registrar",
  // "librarian",
  // "transport",
  // "hostel",
  // "it",
  // "other",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type RouteRule = {
  /** unique key just for readability */
  key: string;

  /** exact path (preferred) */
  path?: string;

  /** prefix match e.g. "/admins" matches "/admins" and "/admins/create" */
  prefix?: string;

  /** allowed roles for that route */
  roles: UserRole[];
};

/**
 * ✅ Extract route rules from navigation config
 * Single source of truth for route permissions
 */
function extractRouteRulesFromNav(): RouteRule[] {
  // Dynamic import to avoid circular dependency
  const { navconfig } = require("@/layout/DashboardLayout/components/navigation.config");
  const rules: RouteRule[] = [];

  function processNavItem(item: any, parentKey = "") {
    const key = parentKey 
      ? `${parentKey}-${item.label.toLowerCase().replace(/\s+/g, "-")}` 
      : item.label.toLowerCase().replace(/\s+/g, "-");
    
    if ("href" in item) {
      // Direct route
      const roles = item.roles || (USER_ROLES as unknown as UserRole[]); // No roles = all roles
      const rule: RouteRule = {
        key,
        prefix: item.href,
        roles,
      };
      rules.push(rule);
    } else if ("children" in item) {
      // Process children
      item.children.forEach((child: any) => processNavItem(child, key));
    }
  }

  navconfig.forEach((item: any) => processNavItem(item));
  return rules;
}

// Cache the route rules to avoid repeated extraction
let _cachedRouteRules: RouteRule[] | null = null;

export const PRIVATE_ROUTE_RULES = (): RouteRule[] => {
  if (!_cachedRouteRules) {
    _cachedRouteRules = extractRouteRulesFromNav();
  }
  return _cachedRouteRules;
};

export function isIgnoredPath(pathname: string) {
  return IGNORE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function isPublicPath(pathname: string) {
  return isRouteInList(pathname, PUBLIC_ROUTES);
}

export function matchPrivateRule(pathname: string): RouteRule | null {
  const rules = PRIVATE_ROUTE_RULES();
  for (const rule of rules) {
    if (rule.path && pathname === rule.path) return rule;
    if (rule.prefix && (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/"))) return rule;
  }
  return null;
}

/** If a route is not public and not ignored and not matched → treat as not-found */
export function isKnownPrivateRoute(pathname: string) {
  return Boolean(matchPrivateRule(pathname));
}

export function canAccessRoute(userRole: string | undefined | null, pathname: string): boolean {
  const rule = matchPrivateRule(pathname);
  if (!rule) return false;
  return rule.roles.includes(userRole as UserRole);
}
