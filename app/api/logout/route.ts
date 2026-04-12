import { NextResponse } from "next/server";
import { getAuthUser } from "@/services/auth";
import { handleRouteError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Get the current user (optional - for logging)
    const user = await getAuthUser(req);
    
    console.log("🚪 Logout request:", user ? `User ${user.id}` : "Anonymous");

    // Create response that clears the token cookie
    const response = NextResponse.json(
      { 
        success: true, 
        message: "Logged out successfully" 
      },
      { status: 200 }
    );

    // Clear the token cookie with same settings as set
    response.cookies.set("token", "", {
      expires: new Date(0), // Set to expired date to delete cookie
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("❌ Logout error:", err);
    return handleRouteError(err);
  }
}
