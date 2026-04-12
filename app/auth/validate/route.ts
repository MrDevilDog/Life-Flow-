import { NextResponse } from "next/server"
import { verifyToken } from "@/services/auth";

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    // Extract token from Authorization header
    const auth = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 }
      );
    }
    
    const token = auth.replace("Bearer ", "");
    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      )
    }

    // 🔥 Fix: allow dynamic fields
    const u = user as any;

    return NextResponse.json({
      success: true,
      user: {
        id: u.id,
        email: u.email ?? null,
        name: u.name ?? null,
        role: u.role ?? "user",

        email_verified: u.email_verified ?? false,
        phone_verified: u.phone_verified ?? false,

        // ✅ FIXED (no TS error now)
        location: u.location ?? null,
      }
    })

  } catch (error) {
    console.error("Token validation error:", error)

    return NextResponse.json(
      { success: false, error: "Validation failed" },
      { status: 500 }
    )
  }
}