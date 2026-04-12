import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req)

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