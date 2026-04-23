/**
 * User Profile API Route
 * Returns current user's profile information including donor details
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { jsonError, handleRouteError } from "@/lib/http";
import { requireAuthUser } from "@/services/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    console.log("=== GET USER PROFILE API ===");
    
    // Get authenticated user from request
    const authUser = await requireAuthUser(req);
    console.log("Authenticated user:", authUser.id);

    // Query to get user and donor information
    const rows = await db.query<any[]>(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at, u.email_verified, u.phone_verified, u.verification_type,
              d.blood_group, d.location, d.availability, d.lat, d.lng
       FROM users u
       LEFT JOIN donors d ON u.id = d.user_id
       WHERE u.id = ? LIMIT 1`,
      [authUser.id]
    );

    const user = rows[0];
    if (!user) {
      console.log("User not found");
      return jsonError(404, "User not found");
    }

    console.log("User profile found:", {
      id: user.id,
      name: user.name,
      email: user.email
    });

    // Return user profile data
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      verification_type: user.verification_type,
      created_at: user.created_at,
      blood_group: user.blood_group,
      location: user.location,
      availability: user.availability ? Boolean(user.availability) : null,
      lat: user.lat,
      lng: user.lng
    };

    console.log("Returning user profile:", userProfile);

    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (err: unknown) {
    console.error("Get user profile error:", err);
    
    // Return a user-friendly error response
    return handleRouteError(err);
  }
}
