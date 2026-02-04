// src/config/routes.ts

// Pages that should NOT use DashboardLayout
export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forget-password",
  "/debug-auth",
  "/debug-cookies",
] as const;

// Middleware ignores these prefixes
export const IGNORE_PREFIXES = ["/api", "/_next", "/favicon.ico"] as const;

// Helper: checks exact route or nested route
export function isRouteInList(pathname: string, routes: readonly string[]) {
  return routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}
