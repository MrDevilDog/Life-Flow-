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

    const { name, phone, blood_group, location, availability, lat, lng } = parsed;
    
    console.log("Profile update request:", { 
      userId: authUser.id, 
      name, 
      phone: phone ? `${phone.substring(0, 3)}***` : null, 
      blood_group, 
      location, 
      availability, 
      lat, 
      lng 
    });

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

    // Update donor profile if any donor fields are provided
    if (blood_group !== undefined || location !== undefined || availability !== undefined || lat !== undefined || lng !== undefined) {
      const donorUpdates: string[] = [];
      const donorValues: any[] = [];

      if (blood_group !== undefined) {
        donorUpdates.push("blood_group = ?");
        donorValues.push(blood_group);
      }

      if (location !== undefined) {
        donorUpdates.push("location = ?");
        donorValues.push(location);
      }

      if (availability !== undefined) {
        donorUpdates.push("availability = ?");
        donorValues.push(availability ? 1 : 0);
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
        console.log("Donor profile updated successfully");
      }
    }

    // Fetch and return updated user data
    const updatedUserRows = await db.query<any[]>(
      `SELECT u.id, u.name, u.email, u.phone, u.email_verified, u.phone_verified, u.verification_type, u.created_at,
              d.blood_group, d.location, d.availability, d.lat, d.lng
       FROM users u
       LEFT JOIN donors d ON u.id = d.user_id
       WHERE u.id = ? LIMIT 1`,
      [authUser.id]
    );

    if (updatedUserRows.length === 0) {
      return jsonError(404, "User not found after update");
    }

    const updatedUser = updatedUserRows[0];
    console.log("Updated user data:", {
      id: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone ? `${updatedUser.phone.substring(0, 3)}***` : null,
      blood_group: updatedUser.blood_group,
      location: updatedUser.location,
      availability: updatedUser.availability
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        email_verified: updatedUser.email_verified,
        phone_verified: updatedUser.phone_verified,
        verification_type: updatedUser.verification_type,
        created_at: updatedUser.created_at,
        donor_profile: updatedUser.blood_group ? {
          blood_group: updatedUser.blood_group,
          location: updatedUser.location,
          availability: updatedUser.availability,
          lat: updatedUser.lat,
          lng: updatedUser.lng
        } : null
      }
    });

  } catch (err: unknown) {
    console.error("Update profile error:", err);
    
    // Handle specific database errors
    if (err instanceof Error) {
      // MySQL error code 23505 = duplicate key violation
      if (err.message.includes("23505") || err.message.includes("Duplicate entry")) {
        if (err.message.includes("phone") || err.message.includes("users.phone") || err.message.includes("users_phone_key")) {
          console.log("Phone number already exists:", err.message);
          return jsonError(400, "Phone number already exists");
        }
        if (err.message.includes("blood_group") || err.message.includes("blood_group_type")) {
          console.log("Invalid blood group value:", err.message);
          return jsonError(400, "Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-");
        }
      }
      if (err.message.includes("Data too long")) {
        return jsonError(400, "One of the fields is too long. Please check your input.");
      }
      if (err.message.includes("Unknown column")) {
        return jsonError(500, "Database schema error: Please contact support.");
      }
    }
    
    return handleRouteError(err);
  }
}
