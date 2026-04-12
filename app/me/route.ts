import { NextResponse } from "next/server";

import { getAuthUser, requireAuthUser } from "@/services/auth";
import { handleRouteError, jsonError } from "@/lib/http";
import { db } from "@/lib/mysql";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const authUser = await requireAuthUser(req);
    
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
      return jsonError(404, "User not found");
    }

    // Create donor record if it doesn't exist
    if (!user.blood_group && user.phone) {
      try {
        await db.query(
          "INSERT INTO donors (user_id, blood_group, location, phone, availability, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [authUser.id, 'O+', 'Unknown', user.phone, 1, 0, 0]
        );
        
        // Re-fetch user data with donor record
        const updatedRows = await db.query<any[]>(
          `SELECT u.id, u.name, u.email, u.phone, u.created_at, u.email_verified, u.phone_verified, u.verification_type,
                  d.blood_group, d.location, d.availability, d.lat, d.lng
           FROM users u
           LEFT JOIN donors d ON u.id = d.user_id
           WHERE u.id = ? LIMIT 1`,
          [authUser.id]
        );
        
        if (updatedRows.length > 0) {
          Object.assign(user, updatedRows[0]);
        }
      } catch (err) {
        console.error("Failed to create donor record:", err);
        // Don't fail the request if donor creation fails
      }
    }

    // Return complete user profile data
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

    return NextResponse.json({ user: userProfile }, { status: 200 });
  } catch (err: unknown) {
    return handleRouteError(err);
  }
}

