import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { profileUpdateSchema } from "@/lib/validators";
import { jsonError, handleRouteError } from "@/lib/http";
import { requireAuthUser } from "@/services/auth";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const authUser = await requireAuthUser(req);

    const userRows = await db.query<any[]>(
      `SELECT u.id, u.name, u.email, u.phone, u.email_verified, u.phone_verified, u.verification_type, u.created_at,
              d.blood_group, d.location, d.availability, d.lat, d.lng
       FROM users u
       LEFT JOIN donors d ON u.id = d.user_id
       WHERE u.id = ? LIMIT 1`,
      [authUser.id]
    );

    if (userRows.length === 0) {
      return jsonError(404, "User not found");
    }

    const user = userRows[0];
    
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        verification_type: user.verification_type, // NEW: Include verification type
        created_at: user.created_at,
        donor_profile: user.blood_group ? {
          blood_group: user.blood_group,
          location: user.location,
          availability: user.availability,
          lat: user.lat,
          lng: user.lng
        } : null
      }
    });

  } catch (err: unknown) {
    console.error("Get profile error:", err);
    return handleRouteError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await requireAuthUser(req);
    const body = await req.json();
    
    let parsed;
    try {
      parsed = profileUpdateSchema.parse(body);
    } catch (validationErr) {
      if (validationErr instanceof z.ZodError) {
        return jsonError(400, validationErr.errors.map(e => e.message).join(", "));
      }
      return jsonError(400, "Validation failed");
    }

    // Get user's verification type to enforce field locking
    const userVerificationRows = await db.query<any[]>(
      "SELECT verification_type FROM users WHERE id = ? LIMIT 1",
      [authUser.id]
    );
    
    const verificationType = userVerificationRows[0]?.verification_type;
    console.log("🔒 User verification type:", verificationType);

    const { name, phone, location, lat, lng } = parsed;

    // Field locking logic
    if (verificationType === 'email' && phone && phone !== authUser.phone) {
      console.log("❌ Attempt to change phone when verified via email");
      return jsonError(400, "Phone number cannot be updated when verified via email");
    }

    // Check if phone is being updated and if it's already taken
    if (phone && phone !== authUser.phone && verificationType !== 'email') {
      const existingPhone = await db.query<any[]>(
        "SELECT id FROM users WHERE phone = ? AND id != ? LIMIT 1",
        [phone, authUser.id]
      );

      if (existingPhone.length > 0) {
        return jsonError(400, "Phone number already exists");
      }
    }

    // Update user profile
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }

    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }

    if (updates.length > 0) {
      values.push(authUser.id);
      await db.query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
    }

    // Update donor location if provided
    if (location !== undefined || lat !== undefined || lng !== undefined) {
      const donorUpdates: string[] = [];
      const donorValues: any[] = [];

      if (location !== undefined) {
        donorUpdates.push("location = ?");
        donorValues.push(location);
      }

      if (lat !== undefined) {
        donorUpdates.push("lat = ?");
        donorValues.push(lat);
      }

      if (lng !== undefined) {
        donorUpdates.push("lng = ?");
        donorValues.push(lng);
      }

      if (donorUpdates.length > 0) {
        donorValues.push(authUser.id);
        await db.query(
          `UPDATE donors SET ${donorUpdates.join(", ")} WHERE user_id = ?`,
          donorValues
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully"
    });

  } catch (err: unknown) {
    console.error("Update profile error:", err);
    return handleRouteError(err);
  }
}
