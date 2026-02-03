import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require authentication
const protectedRoutes = ['/'];

// Public routes that don't require auth
const publicRoutes = ['/login', '/forget-password'];

// Static/API routes to ignore
const ignoreRoutes = ['/api', '/_next', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static/API routes
  if (ignoreRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for refresh token (httpOnly cookie) - try common variations
  const allCookies = Array.from(request.cookies.getAll());
  const hasRefreshToken = request.cookies.has('refresh_token') || 
                          request.cookies.has('refreshToken') ||
                          request.cookies.has('refresh') ||
                          allCookies.some(cookie => 
                            cookie.name.includes('refresh') && 
                            cookie.value && 
                            cookie.value.trim() !== '' &&
                            cookie.value !== 'undefined' &&
                            cookie.value !== 'null'
                          );
  
  // console.log('=== MIDDLEWARE DEBUG ===');
  // console.log('Path:', pathname);
  // console.log('All cookies:', allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));
  // console.log('Has valid refresh token:', hasRefreshToken);
  
  // Check if current path is protected (exclude public routes)
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  ) && !publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Check if current path is public auth route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  console.log('Route classification:', { isProtectedRoute, isPublicRoute, pathname });

  // Handle public routes - allow access, redirect if authenticated
  if (isPublicRoute) {
    if (hasRefreshToken) {
      // console.log('Redirecting to overview - has refresh token');
      return NextResponse.redirect(new URL('/overview', request.url));
    }
    // Allow access to public routes when not authenticated
    return NextResponse.next();
  }

  // Handle protected routes - redirect to login if not authenticated
  if (isProtectedRoute && !hasRefreshToken) {
    // console.log('Redirecting to login - protected route without auth');
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
  }

  // Only redirect away from public routes if we have clear evidence of authentication
  if (isPublicRoute && hasRefreshToken) {
    // console.log('Redirecting to dashboard - has refresh token');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Root path redirect - check for auth state
  if (pathname === '/') {
    if (hasRefreshToken) {
      // console.log('Root redirect to dashboard (has auth)');
      return NextResponse.redirect(new URL('/overview', request.url));
    } else {
      // console.log('Root redirect to login (no auth)');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // console.log('Allowing request to continue - client-side auth will handle protection');
  return NextResponse.next();
}


export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
