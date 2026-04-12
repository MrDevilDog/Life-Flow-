/**
 * Authentication Middleware for Access Control
 * Protects API routes and enforces strict access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireAuthUser, AuthUser } from './auth';

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/emergency',
  '/search', // Public donor search page
  '/api/login',
  '/api/register',
  '/api/forgot-password',
  '/api/send-otp',
  '/api/verify-otp',
  '/api/emergency',
  '/api/donors', // Public donor browsing (limited data for guests)
  '/api/donors/public', // Public donor search for emergency requests
];

// Protected routes that require authentication
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/history',
  '/donors',
  '/requests',
  '/api/donors',
  '/api/requests',
  '/api/user',
  '/api/admin',
];

/**
 * Check if a route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    // Exact match
    if (pathname === route) return true;
    // Prefix match for API routes
    if (route.startsWith('/api/') && pathname.startsWith(route)) return true;
    // Dynamic routes
    if (route.includes(':')) {
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    }
    return false;
  });
}

/**
 * Check if a route is protected
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => {
    // Exact match
    if (pathname === route) return true;
    // Prefix match for API routes
    if (route.startsWith('/api/') && pathname.startsWith(route)) return true;
    // Dynamic routes
    if (route.includes(':')) {
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    }
    return false;
  });
}

/**
 * Authentication middleware for API routes
 */
export function withAuth(handler: (req: NextRequest, context?: any, user?: AuthUser) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      // Check if the route is public
      const pathname = new URL(req.url).pathname;
      
      if (isPublicRoute(pathname)) {
        // Public route - allow access
        return await handler(req, context);
      }

      // Protected route - check authentication
      const user = await getAuthUser(req);
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required. Please login.' },
          { status: 401 }
        );
      }

      // Call the original handler with user context
      return await handler(req, context, user);

    } catch (error: any) {
      console.error('Auth middleware error:', error);
      
      // Handle auth errors specifically
      if (error.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token. Please login again.' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Get user from request (for use in API routes)
 */
export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  return await getAuthUser(req);
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, requiredRole: string): boolean {
  if (!user || !user.role) return false;

  // Admin-only routes must remain strict.
  if (requiredRole === 'admin') {
    return user.role === 'admin';
  }
  
  // Admin can access everything
  if (user.role === 'admin') return true;
  
  // Check specific role requirements
  switch (requiredRole) {
    case 'user':
      return user.role === 'user' || user.role === 'hospital';
    case 'hospital':
      return user.role === 'hospital';
    default:
      return false;
  }
}

/**
 * Role-based access control middleware
 */
export function withRole(requiredRole: string) {
  return function(handler: (req: NextRequest, context?: any, user?: AuthUser) => Promise<NextResponse>) {
    return withAuth(async (req: NextRequest, context?: any, user?: AuthUser) => {
      if (!hasRole(user || null, requiredRole)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return await handler(req, context, user);
    });
  };
}

/**
 * Emergency access override (allows emergency requests without full auth)
 */
export function withEmergencyAccess(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    const pathname = new URL(req.url).pathname;
    
    // Allow emergency requests without full authentication
    if (pathname.startsWith('/api/emergency')) {
      return await handler(req, context);
    }

    // For other routes, require full authentication
    return withAuth(handler)(req, context);
  };
}
