// src/router/routes.ts

export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forget-password",
  "/debug-auth",
  "/debug-cookies",
] as const;

export const SYSTEM_ROUTES = ["/not-found", "/forbidden"] as const;

export const IGNORE_PREFIXES = ["/api", "/_next", "/favicon.ico"] as const;

// ✅ Add static private routes that might not be in navconfig
// Add every private page root here (prefix match)
export const STATIC_PRIVATE_PREFIXES = [
  "/overview",
  "/academic-year",
  "/admins",
  "/batches",
  "/classes",
  "/sections",
] as const;

// Helper: checks exact route or nested route
export function isRouteInList(pathname: string, routes: readonly string[]) {
  return routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export function isIgnoredPath(pathname: string) {
  return IGNORE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function isPublicPath(pathname: string) {
  return isRouteInList(pathname, PUBLIC_ROUTES);
}

export function isSystemPath(pathname: string) {
  return isRouteInList(pathname, SYSTEM_ROUTES);
}

export const USER_ROLES = [
  "superadmin",
  "admin",
  "principal",
  "teacher",
  "coordinator",
  "accountant",
  "cashier",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type RouteRule = {
  key: string;
  path?: string;
  prefix?: string;
  roles: UserRole[];
};

/**
 * Extract route rules from navigation config
 */
function extractRouteRulesFromNav(): RouteRule[] {
  const { navconfig } = require("@/layout/DashboardLayout/components/navigation.config");
  const rules: RouteRule[] = [];

  function processNavItem(item: any, parentKey = "") {
    const key = parentKey
      ? `${parentKey}-${item.label.toLowerCase().replace(/\s+/g, "-")}`
      : item.label.toLowerCase().replace(/\s+/g, "-");

    if ("href" in item) {
      const roles = item.roles || (USER_ROLES as unknown as UserRole[]);
      rules.push({
        key,
        prefix: item.href,
        roles,
      });
    } else if ("children" in item) {
      item.children.forEach((child: any) => processNavItem(child, key));
    }
  }

  navconfig.forEach((item: any) => processNavItem(item));
  return rules;
}

let _cachedRouteRules: RouteRule[] | null = null;

export const PRIVATE_ROUTE_RULES = (): RouteRule[] => {
  if (!_cachedRouteRules) _cachedRouteRules = extractRouteRulesFromNav();
  return _cachedRouteRules;
};

/**
 * ✅ Match static routes first (so reload works even if navconfig is missing route)
 * ✅ Then match nav-derived routes (sidebar + roles)
 */
export function matchPrivateRule(pathname: string): RouteRule | null {
  // 1) Static private prefixes
  for (const prefix of STATIC_PRIVATE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return {
        key: `static-${prefix}`,
        prefix,
        roles: USER_ROLES as unknown as UserRole[],
      };
    }
  }

  // 2) Nav-derived rules
  const rules = PRIVATE_ROUTE_RULES();
  for (const rule of rules) {
    if (rule.path && pathname === rule.path) return rule;
    if (rule.prefix && (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/"))) {
      return rule;
    }
  }

  return null;
}

export function isKnownPrivateRoute(pathname: string) {
  return Boolean(matchPrivateRule(pathname));
}

export function canAccessRoute(userRole: string | undefined | null, pathname: string): boolean {
  const rule = matchPrivateRule(pathname);
  if (!rule) return false;
  return rule.roles.includes(userRole as UserRole);
}
