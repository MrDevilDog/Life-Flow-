import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { assertEnv } from "@/lib/env"

export function middleware(req: NextRequest) {
  // Skip middleware for static files and public routes
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/api/login") ||
    req.nextUrl.pathname.startsWith("/api/register") ||
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/")
  ) {
    return NextResponse.next()
  }

  try {
    assertEnv()
    
    // Get token from Authorization header
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    
    if (!token) {
      // For protected routes, redirect to login if no token
      if (
        req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname.startsWith("/hospital/dashboard") ||
        req.nextUrl.pathname.startsWith("/profile") ||
        req.nextUrl.pathname.startsWith("/api/me") ||
        req.nextUrl.pathname.startsWith("/api/profile")
      ) {
        const loginUrl = new URL("/login", req.url)
        return NextResponse.redirect(loginUrl)
      }
      return NextResponse.next()
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    if (!decoded || !decoded.sub) {
      // Invalid token
      if (
        req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname.startsWith("/hospital/dashboard") ||
        req.nextUrl.pathname.startsWith("/profile") ||
        req.nextUrl.pathname.startsWith("/api/me") ||
        req.nextUrl.pathname.startsWith("/api/profile")
      ) {
        const loginUrl = new URL("/login", req.url)
        return NextResponse.redirect(loginUrl)
      }
      return NextResponse.next()
    }

    // Add user info to request headers for API routes
    const response = NextResponse.next()
    response.headers.set("x-user-id", decoded.sub)
    response.headers.set("x-user-role", decoded.role)
    
    return response
    
  } catch (error) {
    console.error("Middleware error:", error)
    
    // For protected routes, redirect to login on error
    if (
      req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/hospital/dashboard") ||
      req.nextUrl.pathname.startsWith("/profile") ||
      req.nextUrl.pathname.startsWith("/api/me") ||
      req.nextUrl.pathname.startsWith("/api/profile")
    ) {
      const loginUrl = new URL("/login", req.url)
      return NextResponse.redirect(loginUrl)
    }
    
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
